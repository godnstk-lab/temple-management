import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Lock, LogOut, Plus, Trash2, Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyBt-2DpZfQVM35YBajQEJI0D8LSN1HzL_4",
  authDomain: "temple-management-49ae1.firebaseapp.com",
  databaseURL: "https://temple-management-49ae1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "temple-management-49ae1",
  storageBucket: "temple-management-49ae1.firebasestorage.app",
  messagingSenderId: "753617201876",
  appId: "1:753617201876:web:6ebd3c15c76dd3db536941"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);

// 재사용 가능한 컴포넌트들 - React.memo로 최적화
const PhotoUploadButtons = React.memo(({ onPhotoChange, show, currentCount = 0, maxCount = 3 }) => {
  if (!show || currentCount >= maxCount) return null;
  return (
    <div className="flex gap-2">
      <label className="cursor-pointer" title="카메라로 촬영">
        <div className="w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center transition-all shadow-md border-2 border-blue-300">
          <span className="text-xl">📷</span>
        </div>
        <input type="file" accept="image/*" capture="environment" onChange={onPhotoChange} className="hidden" />
      </label>
      <label className="cursor-pointer" title="갤러리에서 선택">
        <div className="w-10 h-10 bg-amber-100 hover:bg-amber-200 rounded-full flex items-center justify-center transition-all shadow-md border-2 border-amber-300">
          <span className="text-xl">📁</span>
        </div>
        <input type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
      </label>
    </div>
  );
});

const MultiPhotoPreview = React.memo(({ photos, onRemove }) => {
  if (!photos || photos.length === 0) return null;
  return (
    <div className="mb-3 sm:mb-4 bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {photos.map((photo, index) => (
          <div key={index} className="relative">
            <img src={photo} alt={`미리보기 ${index + 1}`} className="w-full h-48 object-cover rounded-lg shadow-lg border-2 border-amber-300" />
            <button type="button" onClick={() => onRemove(index)} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              {index + 1}/3
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-gray-500 mt-2">사진 {photos.length}/3장 (×를 눌러 삭제)</p>
    </div>
  );
});

const SizeSelector = React.memo(({ value, onChange }) => (
  <div>
    <label className="block text-xs sm:text-sm font-bold text-amber-900 mb-2">크기</label>
    <div className="flex gap-2">
      {['소', '중', '대'].map(size => (
        <button
          key={size}
          type="button"
          onClick={() => onChange(size)}
          className={`flex-1 py-2 text-sm sm:text-base rounded-lg font-bold transition-all ${
            value === size ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {size}
        </button>
      ))}
    </div>
  </div>
));

const FormInput = React.memo(({ label, required, className = '', ...props }) => (
  <div className={className}>
    <label className="block text-sm sm:text-base font-bold text-amber-900 mb-2">
      {label} {required && '*'}
    </label>
    <input
      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
      {...props}
    />
  </div>
));

const BulsaFormFields = React.memo(({ form, setForm }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
    <FormInput label="불사내용" type="text" value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} placeholder="예: 용두관음" />
    <FormInput label="불사금액 (만원)" type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} placeholder="0" />
    <FormInput label="봉안자/복위자" type="text" value={form.person} onChange={(e) => setForm({...form, person: e.target.value})} placeholder="OO생-홍길동" />
    <SizeSelector value={form.size} onChange={(size) => setForm({...form, size})} />
    <div className="md:col-span-2">
      <FormInput label="봉안위치" type="text" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder="예: 1층 동쪽" />
    </div>
  </div>
));

// 정렬 버튼 컴포넌트
const SortButton = React.memo(({ currentSort, column, onSort }) => {
  const isActive = currentSort.column === column;
  const direction = isActive ? currentSort.direction : null;
  
  return (
    <button
      onClick={() => onSort(column)}
      className={`ml-2 p-1 rounded transition-all ${
        isActive 
          ? 'bg-amber-200 text-amber-900' 
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
      title={`${column === 'bulsa' ? '불사금액' : '입금액'} ${direction === 'asc' ? '내림차순' : '오름차순'} 정렬`}
    >
      {direction === 'asc' ? (
        <ChevronUp className="w-4 h-4" />
      ) : direction === 'desc' ? (
        <ChevronDown className="w-4 h-4" />
      ) : (
        <div className="w-4 h-4 flex flex-col items-center justify-center">
          <ChevronUp className="w-3 h-2 -mb-1" />
          <ChevronDown className="w-3 h-2" />
        </div>
      )}
    </button>
  );
});

export default function TempleManagementSystem() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [believers, setBelievers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedBeliever, setSelectedBeliever] = useState(null);
  const [showBulsaPopup, setShowBulsaPopup] = useState(false);
  const [showDepositPopup, setShowDepositPopup] = useState(false);
  const [showBulsaEditPopup, setShowBulsaEditPopup] = useState(false);
  const [editingBulsaIndex, setEditingBulsaIndex] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(true);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bulsaPhotoFiles, setBulsaPhotoFiles] = useState([]);
  const [bulsaPhotoPreviews, setBulsaPhotoPreviews] = useState([]);
  const [editBulsaPhotoFiles, setEditBulsaPhotoFiles] = useState([]);
  const [editBulsaPhotoPreviews, setEditBulsaPhotoPreviews] = useState([]);
  const [viewPhotoModal, setViewPhotoModal] = useState(false);
  const [viewPhotoUrl, setViewPhotoUrl] = useState('');
  const [showBulsaDeleteConfirm, setShowBulsaDeleteConfirm] = useState(false);
  const [deleteBulsaInfo, setDeleteBulsaInfo] = useState(null);
  const [showDepositDeleteConfirm, setShowDepositDeleteConfirm] = useState(false);
  const [deleteDepositInfo, setDeleteDepositInfo] = useState(null);
  const [showMonthlyDepositPopup, setShowMonthlyDepositPopup] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  
  // 정렬 상태 추가
  const [sortConfig, setSortConfig] = useState({ column: null, direction: null });
  
  // useMemo로 상수 최적화
  const emptyForm = useMemo(() => ({ name: '', phone: '', address: '', bulsa: [], deposits: [], unpaid: '' }), []);
  const emptyBulsa = useMemo(() => ({ content: '', amount: '', person: '', size: '', location: '', photoURLs: [] }), []);
  const emptyDeposit = useMemo(() => ({ date: '', amount: '' }), []);
  
  const [formData, setFormData] = useState(emptyForm);
  const [newBulsaData, setNewBulsaData] = useState(emptyBulsa);
  const [bulsaForm, setBulsaForm] = useState(emptyBulsa);
  const [depositForm, setDepositForm] = useState(emptyDeposit);
  const [editBulsaForm, setEditBulsaForm] = useState(emptyBulsa);

  useEffect(() => {
    const believersRef = ref(database, 'believers');
    const unsubscribe = onValue(believersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const believersArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setBelievers(believersArray);
      } else {
        setBelievers([]);
      }
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
    }
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // 뒤로가기 처리 최적화
  const closeCurrentPopup = useCallback(() => {
    if (viewPhotoModal) {
      setViewPhotoModal(false);
      setViewPhotoUrl('');
      return true;
    }
    if (showBulsaDeleteConfirm) {
      setShowBulsaDeleteConfirm(false);
      setDeleteBulsaInfo(null);
      return true;
    }
    if (showDepositDeleteConfirm) {
      setShowDepositDeleteConfirm(false);
      setDeleteDepositInfo(null);
      return true;
    }
    if (showMonthlyDepositPopup) {
      setShowMonthlyDepositPopup(false);
      setSelectedMonth('');
      return true;
    }
    if (showBulsaEditPopup) {
      setShowBulsaEditPopup(false);
      setEditingBulsaIndex(null);
      setEditBulsaForm(emptyBulsa);
      editBulsaPhotoPreviews.forEach(url => URL.revokeObjectURL(url));
      setEditBulsaPhotoFiles([]);
      setEditBulsaPhotoPreviews([]);
      return true;
    }
    if (showBulsaPopup) {
      setShowBulsaPopup(false);
      setBulsaForm(emptyBulsa);
      bulsaPhotoPreviews.forEach(url => URL.revokeObjectURL(url));
      setBulsaPhotoFiles([]);
      setBulsaPhotoPreviews([]);
      return true;
    }
    if (showDepositPopup) {
      setShowDepositPopup(false);
      setDepositForm(emptyDeposit);
      return true;
    }
    if (showEditPopup) {
      setShowEditPopup(false);
      setSelectedBeliever(null);
      setFormData(emptyForm);
      return true;
    }
    if (showDeletePopup) {
      setShowDeletePopup(false);
      setSelectedBeliever(null);
      return true;
    }
    if (showAddForm) {
      setShowAddForm(false);
      setFormData(emptyForm);
      setNewBulsaData(emptyBulsa);
      photoPreviews.forEach(url => URL.revokeObjectURL(url));
      setPhotoFiles([]);
      setPhotoPreviews([]);
      return true;
    }
    return false;
  }, [
    viewPhotoModal, showBulsaDeleteConfirm, showDepositDeleteConfirm, showMonthlyDepositPopup,
    showBulsaEditPopup, showBulsaPopup, showDepositPopup,
    showEditPopup, showDeletePopup, showAddForm,
    emptyBulsa, emptyDeposit, emptyForm,
    editBulsaPhotoPreviews, bulsaPhotoPreviews, photoPreviews
  ]);

  useEffect(() => {
    const handlePopState = () => {
      if (!isLoggedIn) return;
      closeCurrentPopup();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isLoggedIn, closeCurrentPopup]);

  // 히스토리 관리 최적화
  const historyPushRef = React.useRef(false);
  
  useEffect(() => {
    if (!isLoggedIn || historyPushRef.current) return;

    const anyPopupOpen = showAddForm || showEditPopup || showDeletePopup || 
                         showBulsaPopup || showDepositPopup || showBulsaEditPopup || 
                         viewPhotoModal || showBulsaDeleteConfirm || showDepositDeleteConfirm || showMonthlyDepositPopup;

    if (anyPopupOpen) {
      historyPushRef.current = true;
      window.history.pushState(null, '', window.location.href);
      
      setTimeout(() => {
        historyPushRef.current = false;
      }, 100);
    }
  }, [
    isLoggedIn, showAddForm, showEditPopup, showDeletePopup,
    showBulsaPopup, showDepositPopup, showBulsaEditPopup,
    viewPhotoModal, showBulsaDeleteConfirm, showDepositDeleteConfirm, showMonthlyDepositPopup
  ]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // iOS인지 확인
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      
      if (isInStandaloneMode) {
        alert('이미 홈 화면에 추가되어 있습니다! ✅');
        return;
      }
      
      if (isIOS) {
        alert('📱 아이폰 홈 화면에 추가하는 방법:\n\n1. 하단 공유 버튼 (□↑) 탭\n2. 아래로 스크롤\n3. "홈 화면에 추가" 선택\n4. "추가" 탭\n\n✨ 앱처럼 사용할 수 있습니다!');
      } else {
        alert('📱 안드로이드 홈 화면에 추가하는 방법:\n\n1. 우측 상단 점 3개 (⋮) 탭\n2. "홈 화면에 추가" 또는 "앱 설치" 선택\n3. "추가" 또는 "설치" 탭\n\n✨ 앱처럼 사용할 수 있습니다!');
      }
      return;
    }
    
    // Android Chrome - 자동 설치 프롬프트
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallButton(false);
        alert('✅ 설치 완료!\n홈 화면에서 앱을 확인하세요.');
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error('설치 오류:', error);
    }
  };

  const saveBelievers = async (newBelievers) => {
    try {
      const believersRef = ref(database, 'believers');
      const believersObj = {};
      newBelievers.forEach(believer => { believersObj[believer.id] = believer; });
      await set(believersRef, believersObj);
    } catch (error) {
      console.error('저장 실패:', error);
      alert('데이터 저장에 실패했습니다.');
    }
  };

  const handleLogin = () => {
    if (loginPassword === '1023') {
      setIsLoggedIn(true);
      setUserRole('admin');
    } else if (loginPassword === '0804') {
      setIsLoggedIn(true);
      setUserRole('user');
    } else {
      alert('비밀번호가 올바르지 않습니다.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole('');
    setLoginPassword('');
    setShowAddForm(false);
  };

  const handleInputChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);
  
  // 이미지 압축 함수 - useCallback으로 최적화
  const compressImage = useCallback((file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }));
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }, []);

  const createThumbnail = useCallback((file) => {
    return compressImage(file, 300, 0.6);
  }, [compressImage]);
  
  const createOriginal = useCallback((file) => {
    return compressImage(file, 1920, 0.85);
  }, [compressImage]);
  
  // 사진 처리 최적화 - 깜빡임 제거
  const handlePhotoChange = useCallback(async (e, filesSetter, previewsSetter, currentFiles, currentPreviews) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (currentFiles.length >= 3) {
      alert('사진은 최대 3장까지 등록할 수 있습니다.');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }
    
    try {
      // 병렬 처리로 속도 향상
      const [compressedFile, thumbnailFile] = await Promise.all([
        createOriginal(file),
        createThumbnail(file)
      ]);
      
      console.log(`원본: ${(file.size / 1024).toFixed(2)}KB → 압축: ${(compressedFile.size / 1024).toFixed(2)}KB → 썸네일: ${(thumbnailFile.size / 1024).toFixed(2)}KB`);
      
      // URL.createObjectURL 사용 (즉시 표시, 깜빡임 없음)
      const previewUrl = URL.createObjectURL(thumbnailFile);
      
      // 상태를 한 번에 업데이트 (깜빡임 방지)
      filesSetter([...currentFiles, { original: compressedFile, thumbnail: thumbnailFile }]);
      previewsSetter([...currentPreviews, previewUrl]);
      
    } catch (error) {
      console.error('이미지 처리 실패:', error);
      alert('이미지 처리에 실패했습니다.');
    }
  }, [createOriginal, createThumbnail]);

  const removePhoto = useCallback((index, filesSetter, previewsSetter, currentFiles, currentPreviews) => {
    // URL 메모리 해제
    if (currentPreviews[index]) {
      URL.revokeObjectURL(currentPreviews[index]);
    }
    
    filesSetter(currentFiles.filter((_, i) => i !== index));
    previewsSetter(currentPreviews.filter((_, i) => i !== index));
  }, []);
  const uploadPhoto = async (file, believerId, isBulsa = false, bulsaId = null, isThumbnail = false) => {
    try {
      const timestamp = Date.now();
      const suffix = isThumbnail ? '_thumb' : '';
      const fileName = isBulsa ? `bulsa_${bulsaId}_${timestamp}${suffix}.jpg` : `${timestamp}${suffix}.jpg`;
      const path = isBulsa ? `believers/${believerId}/bulsa/${fileName}` : `believers/${believerId}/${fileName}`;
      const photoRef = storageRef(storage, path);
      
      const metadata = {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      };
      
      await uploadBytes(photoRef, file, metadata);
      return await getDownloadURL(photoRef);
    } catch (error) {
      console.error('사진 업로드 실패:', error);
      throw error;
    }
  };
  
  const uploadPhotosInParallel = async (files, believerId, isBulsa = false, bulsaId = null) => {
    setUploadProgress(0);
    let completedUploads = 0;
    const totalFiles = files.length * 2;
    
    const uploadPromises = files.map(async (fileObj) => {
      const thumbnailURL = await uploadPhoto(fileObj.thumbnail, believerId, isBulsa, bulsaId, true);
      completedUploads++;
      setUploadProgress(Math.round((completedUploads / totalFiles) * 100));
      
      const originalURL = await uploadPhoto(fileObj.original, believerId, isBulsa, bulsaId, false);
      completedUploads++;
      setUploadProgress(Math.round((completedUploads / totalFiles) * 100));
      
      return { thumbnail: thumbnailURL, original: originalURL };
    });
    
    const results = await Promise.all(uploadPromises);
    setUploadProgress(0);
    return results;
  };
  
  const calcTotals = useCallback((bulsa, deposits) => {
    const totalBulsa = (bulsa || []).reduce((sum, item) => sum + parseInt(item.amount || 0), 0);
    const totalDeposit = (deposits || []).reduce((sum, item) => sum + parseInt(item.amount || 0), 0);
    return { totalBulsa, totalDeposit, unpaid: String(totalBulsa - totalDeposit) };
  }, []);
  
  const formatNumber = useCallback((num) => {
    if (!num) return '0';
    const value = parseInt(num);
    if (value >= 10000) {
      const eok = Math.floor(value / 10000);
      const man = value % 10000;
      if (man === 0) {
        return `${eok}억`;
      }
      return `${eok}억${man.toLocaleString()}`;
    }
    return value.toLocaleString();
  }, []);
  
  const getTotalBulsaAmount = useCallback((bulsa) => (bulsa || []).reduce((sum, b) => sum + parseInt(b.amount || 0), 0), []);
  const getTotalDepositAmount = useCallback((deposits) => (deposits || []).reduce((sum, d) => sum + parseInt(d.amount || 0), 0), []);

  const handleAddBeliever = async () => {
    if (!formData.name || !formData.phone) {
      alert('이름과 전화번호는 필수입니다.');
      return;
    }
    setIsUploading(true);
    try {
      let bulsaArray = [];
      const believerId = Date.now().toString();
      
      if (newBulsaData.content && newBulsaData.amount) {
        let bulsaPhotoURLs = [];
        if (photoFiles.length > 0) {
          bulsaPhotoURLs = await uploadPhotosInParallel(photoFiles, believerId);
        }
        bulsaArray = [{ ...newBulsaData, photoURLs: bulsaPhotoURLs }];
      }
      
      const { unpaid } = calcTotals(bulsaArray, []);
      const newBeliever = { id: believerId, ...formData, bulsa: bulsaArray, deposits: [], unpaid };
      
      const updatedBelievers = [...believers, newBeliever];
      setBelievers(updatedBelievers);
      await saveBelievers(updatedBelievers);
      alert('새 신도가 추가되었습니다.');
      
      // URL 메모리 해제
      photoPreviews.forEach(url => URL.revokeObjectURL(url));
      
      setFormData(emptyForm);
      setNewBulsaData(emptyBulsa);
      setPhotoFiles([]);
      setPhotoPreviews([]);
      setShowAddForm(false);
    } catch (error) {
      alert('신도 추가에 실패했습니다: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = useCallback((believer) => {
    setSelectedBeliever(believer);
    setFormData({ ...believer, bulsa: believer.bulsa || [], deposits: believer.deposits || [], unpaid: believer.unpaid || '' });
    setShowEditPopup(true);
  }, []);

  const confirmEdit = () => {
    if (!formData.name || !formData.phone) {
      alert('이름과 전화번호는 필수입니다.');
      return;
    }
    const updatedBelievers = believers.map(b => 
      b.id === selectedBeliever.id ? { ...b, name: formData.name, phone: formData.phone, address: formData.address } : b
    );
    setBelievers(updatedBelievers);
    saveBelievers(updatedBelievers);
    alert('신도 정보가 수정되었습니다.');
    setShowEditPopup(false);
    setSelectedBeliever(null);
    setFormData(emptyForm);
  };

  const handleDelete = useCallback((believer) => {
    setSelectedBeliever(believer);
    setShowDeletePopup(true);
  }, []);

  const confirmDelete = () => {
    const updatedBelievers = believers.filter(b => b.id !== selectedBeliever.id);
    setBelievers(updatedBelievers);
    saveBelievers(updatedBelievers);
    alert('삭제되었습니다.');
    setShowDeletePopup(false);
    setSelectedBeliever(null);
  };

  const openBulsaPopup = useCallback((believer) => {
    setSelectedBeliever(believer);
    setBulsaForm(emptyBulsa);
    setBulsaPhotoFiles([]);
    setBulsaPhotoPreviews([]);
    setShowBulsaPopup(true);
  }, [emptyBulsa]);

  const addBulsa = async () => {
    if (!bulsaForm.content || !bulsaForm.amount) {
      alert('불사내용, 불사금액은 필수입니다.');
      return;
    }
    try {
      let bulsaPhotoURLs = [];
      if (bulsaPhotoFiles.length > 0) {
        const bulsaId = Date.now().toString();
        bulsaPhotoURLs = await uploadPhotosInParallel(bulsaPhotoFiles, selectedBeliever.id, true, bulsaId);
      }
      const updatedBelievers = believers.map(b => {
        if (b.id === selectedBeliever.id) {
          const newBulsa = [...(b.bulsa || []), { ...bulsaForm, photoURLs: bulsaPhotoURLs }];
          const { unpaid } = calcTotals(newBulsa, b.deposits || []);
          return { ...b, bulsa: newBulsa, unpaid };
        }
        return b;
      });
      setBelievers(updatedBelievers);
      await saveBelievers(updatedBelievers);
      setSelectedBeliever(updatedBelievers.find(b => b.id === selectedBeliever.id));
      alert('불사내용이 추가되었습니다.');
      
      // URL 메모리 해제
      bulsaPhotoPreviews.forEach(url => URL.revokeObjectURL(url));
      
      setBulsaForm(emptyBulsa);
      setBulsaPhotoFiles([]);
      setBulsaPhotoPreviews([]);
    } catch (error) {
      alert('불사 추가 실패: ' + error.message);
    }
  };

  const deleteBulsa = (believerId, index) => {
    const updatedBelievers = believers.map(b => {
      if (b.id === believerId) {
        const newBulsa = b.bulsa.filter((_, i) => i !== index);
        const { unpaid } = calcTotals(newBulsa, b.deposits || []);
        return { ...b, bulsa: newBulsa, unpaid };
      }
      return b;
    });
    setBelievers(updatedBelievers);
    saveBelievers(updatedBelievers);
    setSelectedBeliever(updatedBelievers.find(b => b.id === believerId));
  };

  const openBulsaEditPopup = (index) => {
    setEditingBulsaIndex(index);
    const bulsaItem = selectedBeliever.bulsa[index];
    setEditBulsaForm({ ...bulsaItem });
    setEditBulsaPhotoFiles([]);
    setEditBulsaPhotoPreviews([]);
    setShowBulsaEditPopup(true);
  };
  
  const confirmBulsaEdit = async () => {
    if (!editBulsaForm.content || !editBulsaForm.amount) {
      alert('불사내용, 불사금액은 필수입니다.');
      return;
    }
    try {
      let updatedPhotoURLs = [...(editBulsaForm.photoURLs || [])];
      
      if (editBulsaPhotoFiles.length > 0) {
        const bulsaId = Date.now().toString();
        const newPhotoURLs = await uploadPhotosInParallel(editBulsaPhotoFiles, selectedBeliever.id, true, bulsaId);
        updatedPhotoURLs = [...updatedPhotoURLs, ...newPhotoURLs];
      }
      
      const updatedBelievers = believers.map(b => {
        if (b.id === selectedBeliever.id) {
          const newBulsa = [...b.bulsa];
          newBulsa[editingBulsaIndex] = { ...editBulsaForm, photoURLs: updatedPhotoURLs };
          const { unpaid } = calcTotals(newBulsa, b.deposits || []);
          return { ...b, bulsa: newBulsa, unpaid };
        }
        return b;
      });
      setBelievers(updatedBelievers);
      await saveBelievers(updatedBelievers);
      setSelectedBeliever(updatedBelievers.find(b => b.id === selectedBeliever.id));
      alert('불사내용이 수정되었습니다.');
      
      // URL 메모리 해제
      editBulsaPhotoPreviews.forEach(url => URL.revokeObjectURL(url));
      
      setShowBulsaEditPopup(false);
      setEditingBulsaIndex(null);
      setEditBulsaForm(emptyBulsa);
      setEditBulsaPhotoFiles([]);
      setEditBulsaPhotoPreviews([]);
    } catch (error) {
      alert('불사 수정 실패: ' + error.message);
    }
  };

  const openDepositPopup = useCallback((believer) => {
    setSelectedBeliever(believer);
    setDepositForm(emptyDeposit);
    setShowDepositPopup(true);
  }, [emptyDeposit]);

  const addDeposit = () => {
    if (!depositForm.date || !depositForm.amount) {
      alert('날짜와 금액을 입력해주세요.');
      return;
    }
    const updatedBelievers = believers.map(b => {
      if (b.id === selectedBeliever.id) {
        const newDeposits = [...(b.deposits || []), { ...depositForm }];
        const { unpaid } = calcTotals(b.bulsa || [], newDeposits);
        return { ...b, deposits: newDeposits, unpaid };
      }
      return b;
    });
    setBelievers(updatedBelievers);
    saveBelievers(updatedBelievers);
    setSelectedBeliever(updatedBelievers.find(b => b.id === selectedBeliever.id));
    alert('입금내역이 추가되었습니다.');
    setDepositForm(emptyDeposit);
  };

  const deleteDeposit = (believerId, index) => {
    const updatedBelievers = believers.map(b => {
      if (b.id === believerId) {
        const newDeposits = b.deposits.filter((_, i) => i !== index);
        const { unpaid } = calcTotals(b.bulsa || [], newDeposits);
        return { ...b, deposits: newDeposits, unpaid };
      }
      return b;
    });
    setBelievers(updatedBelievers);
    saveBelievers(updatedBelievers);
    setSelectedBeliever(updatedBelievers.find(b => b.id === believerId));
  };

  // 정렬 핸들러 추가
  const handleSort = useCallback((column) => {
    setSortConfig(prev => {
      if (prev.column === column) {
        // 같은 컬럼 클릭: asc -> desc -> null
        if (prev.direction === 'asc') {
          return { column, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { column: null, direction: null };
        }
      }
      // 다른 컬럼 클릭 또는 null 상태: asc로 시작
      return { column, direction: 'asc' };
    });
  }, []);

  const filteredBelievers = useMemo(() => {
    let result = believers.filter(b => {
      if (!searchTerm) return true;
      const searchParts = searchTerm.trim().split(/\s+/);
      const sizeKeywords = [];
      let textSearchParts = [];
      searchParts.forEach(part => {
        const lowerPart = part.toLowerCase();
        if (lowerPart === '소' || lowerPart === '중' || lowerPart === '대') {
          sizeKeywords.push(part);
        } else {
          textSearchParts.push(part);
        }
      });
      const allTextMatches = textSearchParts.every(searchWord => {
        const lowerSearchWord = searchWord.toLowerCase();
        const nameMatch = (b.name || '').toLowerCase().includes(lowerSearchWord);
        const phoneMatch = (b.phone || '').includes(searchWord);
        const bulsaContentMatch = (b.bulsa || []).some(item => 
          (item.content || '').toLowerCase().includes(lowerSearchWord)
        );
        return nameMatch || phoneMatch || bulsaContentMatch;
      });
      if (sizeKeywords.length === 0) {
        return allTextMatches;
      }
      const hasBulsaWithSize = (b.bulsa || []).some(item => sizeKeywords.includes(item.size));
      return allTextMatches && hasBulsaWithSize;
    });

    // 정렬 적용
    if (sortConfig.column && sortConfig.direction) {
      result = [...result].sort((a, b) => {
        let aValue, bValue;
        
        if (sortConfig.column === 'bulsa') {
          aValue = getTotalBulsaAmount(a.bulsa || []);
          bValue = getTotalBulsaAmount(b.bulsa || []);
        } else if (sortConfig.column === 'deposit') {
          aValue = getTotalDepositAmount(a.deposits || []);
          bValue = getTotalDepositAmount(b.deposits || []);
        }
        
        if (sortConfig.direction === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }

    return result;
  }, [believers, searchTerm, sortConfig, getTotalBulsaAmount, getTotalDepositAmount]);

  const searchTotals = useMemo(() => {
    return filteredBelievers.reduce((totals, believer) => {
      const bulsaTotal = getTotalBulsaAmount(believer.bulsa || []);
      const depositTotal = getTotalDepositAmount(believer.deposits || []);
      const unpaidTotal = parseInt(believer.unpaid || 0);
      return {
        totalBulsa: totals.totalBulsa + bulsaTotal,
        totalDeposit: totals.totalDeposit + depositTotal,
        totalUnpaid: totals.totalUnpaid + unpaidTotal
      };
    }, { totalBulsa: 0, totalDeposit: 0, totalUnpaid: 0 });
  }, [filteredBelievers, getTotalBulsaAmount, getTotalDepositAmount]);

  // 메모이제이션된 콜백들
  const memoizedHandlePhotoChange = useCallback((e) => 
    handlePhotoChange(e, setPhotoFiles, setPhotoPreviews, photoFiles, photoPreviews),
    [handlePhotoChange, photoFiles, photoPreviews]
  );

  const memoizedRemovePhoto = useCallback((index) => 
    removePhoto(index, setPhotoFiles, setPhotoPreviews, photoFiles, photoPreviews),
    [removePhoto, photoFiles, photoPreviews]
  );

  const memoizedHandleBulsaPhotoChange = useCallback((e) => 
    handlePhotoChange(e, setBulsaPhotoFiles, setBulsaPhotoPreviews, bulsaPhotoFiles, bulsaPhotoPreviews),
    [handlePhotoChange, bulsaPhotoFiles, bulsaPhotoPreviews]
  );

  const memoizedRemoveBulsaPhoto = useCallback((index) => 
    removePhoto(index, setBulsaPhotoFiles, setBulsaPhotoPreviews, bulsaPhotoFiles, bulsaPhotoPreviews),
    [removePhoto, bulsaPhotoFiles, bulsaPhotoPreviews]
  );

  const memoizedHandleEditBulsaPhotoChange = useCallback((e) => 
    handlePhotoChange(e, setEditBulsaPhotoFiles, setEditBulsaPhotoPreviews, editBulsaPhotoFiles, editBulsaPhotoPreviews),
    [handlePhotoChange, editBulsaPhotoFiles, editBulsaPhotoPreviews]
  );

  const memoizedRemoveEditBulsaPhoto = useCallback((index) => 
    removePhoto(index, setEditBulsaPhotoFiles, setEditBulsaPhotoPreviews, editBulsaPhotoFiles, editBulsaPhotoPreviews),
    [removePhoto, editBulsaPhotoFiles, editBulsaPhotoPreviews]
  );
  
  // 입금내역을 날짜순으로 정렬하는 함수
  const getSortedDeposits = useCallback((deposits) => {
    if (!deposits || deposits.length === 0) return [];
    return [...deposits].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, []);
  
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-amber-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden" style={{paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)'}}>
        {showInstallButton && (
          <button onClick={handleInstallClick} className="fixed top-4 right-4 z-50 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 font-bold text-sm transition-all animate-pulse" style={{top: 'max(1rem, env(safe-area-inset-top))', right: 'max(1rem, env(safe-area-inset-right))'}}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">앱 설치</span>
            <span className="sm:hidden">설치</span>
          </button>
        )}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjUxLCAyMzUsIDAuMSkiLz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl"></div>
        </div>
        <div className="relative bg-gradient-to-br from-amber-50/95 via-orange-50/95 to-yellow-50/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-12 w-full max-w-md border border-amber-200/50">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-3xl"></div>
          <div className="relative text-center mb-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-white/50 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-full"></div>
              <span className="text-4xl sm:text-5xl relative z-10">🙏</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-900 via-orange-800 to-amber-900 bg-clip-text text-transparent mb-2" style={{fontFamily: 'serif'}}>海雲寺</h1>
              <div className="flex items-center justify-center gap-2">
                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
                <span className="text-amber-800 text-sm font-semibold tracking-wider">해운사</span>
                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
              </div>
              <p className="text-base sm:text-lg text-amber-700 font-medium mt-3">신도관리 시스템</p>
            </div>
          </div>
          <div className="relative space-y-6">
            <div>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl blur opacity-25 group-hover:opacity-40 transition"></div>
                <Lock className="absolute left-4 top-4 w-5 h-5 text-amber-700 z-10" />
                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} className="relative w-full pl-12 pr-4 py-4 border-2 border-amber-300/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white/80 backdrop-blur-sm text-center text-lg shadow-lg transition-all" placeholder="••••" />
              </div>
            </div>
            <button onClick={handleLogin} className="relative w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white font-bold py-4 rounded-xl shadow-xl text-lg overflow-hidden group transition-all hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="relative">입장하기</span>
            </button>
            
            {showInstallButton && (
              <div className="text-center">
                <button 
                  onClick={handleInstallClick}
                  className="inline-flex items-center gap-2 text-sm text-amber-700 hover:text-amber-900 font-semibold transition-colors"
                >
                  <span className="text-lg">📱</span>
                  <span>앱으로 설치하고 편리하게 사용하세요</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 overflow-y-auto" style={{paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)'}}>
      <div className="w-full">
        <div className="bg-gradient-to-r from-amber-600 to-orange-700 shadow-xl border-b-4 border-amber-800">
          <div className="max-w-full px-4 sm:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center shadow-lg border-2 sm:border-4 border-amber-200">
                  <span className="text-2xl sm:text-3xl">🙏</span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-4xl font-bold text-white" style={{fontFamily: 'serif'}}>해운사 신도관리</h1>
                  <p className="text-amber-100 text-xs sm:text-sm mt-1">{userRole === 'admin' ? '관리자' : '일반 사용자'} 모드</p>
                </div>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg transition-colors shadow-md text-sm sm:text-base">
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-full px-4 sm:px-8 py-4 sm:py-6">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-amber-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 sm:left-4 top-3 sm:top-4 w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                <input type="text" placeholder="이름, 전화번호, 불사내용으로 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
              </div>
              {userRole === 'admin' && (
                <button onClick={() => { setShowAddForm(true); setFormData(emptyForm); setNewBulsaData(emptyBulsa); setPhotoFiles([]); setPhotoPreviews([]); }} className="flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-amber-600 to-orange-700 text-white font-bold rounded-lg hover:from-amber-700 hover:to-orange-800 transition-all shadow-md whitespace-nowrap text-sm sm:text-base">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  신도 추가
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-amber-200">
            <h2 className="text-lg sm:text-2xl font-bold text-amber-900 mb-4 sm:mb-6">신도 목록 ({filteredBelievers.length}명)</h2>

            {filteredBelievers.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-amber-700">
                <p className="text-base sm:text-lg">등록된 신도가 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-amber-100 to-orange-100 border-b-2 border-amber-300">
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-amber-900 whitespace-nowrap">이름</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-amber-900 whitespace-nowrap">
                          <div className="flex items-center">
                            <span>불사내용</span>
                            <SortButton 
                              currentSort={sortConfig} 
                              column="bulsa" 
                              onSort={handleSort} 
                            />
                          </div>
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-amber-900 whitespace-nowrap">
                          <div className="flex items-center">
                            <span>입금액</span>
                            <SortButton 
                              currentSort={sortConfig} 
                              column="deposit" 
                              onSort={handleSort} 
                            />
                          </div>
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-bold text-amber-900 whitespace-nowrap">미수금</th>
                        {userRole === 'admin' && (
                          <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-amber-900 whitespace-nowrap">관리</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBelievers.map((believer) => (
                        <tr key={believer.id} className="border-b border-amber-200 hover:bg-amber-50 transition-colors">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-800 font-medium whitespace-nowrap">
                            {userRole === 'admin' ? (
                              <button onClick={() => handleEdit(believer)} className="text-gray-800 hover:text-gray-900 font-semibold underline cursor-pointer">{believer.name}</button>
                            ) : (
                              <span>{believer.name}</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-2 text-xs sm:text-sm whitespace-nowrap">
                            <button onClick={() => openBulsaPopup(believer)} className="text-blue-600 hover:text-blue-800 font-semibold underline">
                              {believer.bulsa && believer.bulsa.length > 0 ? (
                                <div className="flex flex-col items-start leading-tight">
                                  <span className="text-sm font-bold">
                                    {formatNumber(getTotalBulsaAmount(believer.bulsa))}{getTotalBulsaAmount(believer.bulsa) >= 10000 ? '원' : '만'}
                                  </span>
                                  <span className="text-xs text-gray-500">{believer.bulsa.length}건</span>
                                </div>
                              ) : '없음'}
                            </button>
                          </td>
                          <td className="px-3 sm:px-6 py-2 text-xs sm:text-sm whitespace-nowrap">
                            <button onClick={() => openDepositPopup(believer)} className="text-green-600 hover:text-green-800 font-semibold underline">
                              {believer.deposits && believer.deposits.length > 0 ? (
                                <div className="flex flex-col items-start leading-tight">
                                  <span className="text-sm font-bold">
                                    {formatNumber(getTotalDepositAmount(believer.deposits))}{getTotalDepositAmount(believer.deposits) >= 10000 ? '원' : '만'}
                                  </span>
                                  <span className="text-xs text-gray-500">{believer.deposits.length}건</span>
                                </div>
                              ) : '없음'}
                            </button>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-right text-red-600 font-bold whitespace-nowrap">
                            {formatNumber(believer.unpaid)}{parseInt(believer.unpaid || 0) >= 10000 ? '원' : '만'}
                          </td>
                          {userRole === 'admin' && (
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1 sm:gap-2">
                                <button onClick={() => handleDelete(believer)} className="px-2 sm:px-4 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors text-xs sm:text-sm">
                                  삭제
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          {filteredBelievers.length > 0 && (
            <div className="mt-4 sm:mt-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 sm:p-6 border-2 border-amber-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-lg font-bold text-amber-900">📊 검색 결과 총합계 ({filteredBelievers.length}명)</h3>
                <button 
                  onClick={() => setShowMonthlyDepositPopup(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-lg transition-all shadow-md text-sm whitespace-nowrap"
                >
                  <span>📅</span>
                  <span>월별 입금내역</span>
                </button>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl">🙏</span>
                      <span className="text-sm sm:text-base font-bold text-gray-700">총 불사금액</span>
                    </div>
                    <div className="text-xl sm:text-3xl font-bold text-blue-600">
                      {formatNumber(searchTotals.totalBulsa)}
                      <span className="text-sm sm:text-base ml-1">{searchTotals.totalBulsa >= 10000 ? '원' : '만원'}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md border-2 border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl">💰</span>
                      <span className="text-sm sm:text-base font-bold text-gray-700">총 입금액</span>
                    </div>
                    <div className="text-xl sm:text-3xl font-bold text-green-600">
                      {formatNumber(searchTotals.totalDeposit)}
                      <span className="text-sm sm:text-base ml-1">{searchTotals.totalDeposit >= 10000 ? '원' : '만원'}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md border-2 border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl">📋</span>
                      <span className="text-sm sm:text-base font-bold text-gray-700">총 미수금</span>
                    </div>
                    <div className="text-xl sm:text-3xl font-bold text-red-600">
                      {formatNumber(searchTotals.totalUnpaid)}
                      <span className="text-sm sm:text-base ml-1">{searchTotals.totalUnpaid >= 10000 ? '원' : '만원'}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md border-2 border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl">📊</span>
                      <span className="text-sm sm:text-base font-bold text-gray-700">입금률</span>
                    </div>
                    <span className="text-xl sm:text-3xl font-bold text-amber-700">
                      {searchTotals.totalBulsa > 0 ? ((searchTotals.totalDeposit / searchTotals.totalBulsa) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 sm:h-3 rounded-full transition-all duration-500"
                      style={{ width: `${searchTotals.totalBulsa > 0 ? Math.min((searchTotals.totalDeposit / searchTotals.totalBulsa) * 100, 100) : 0}%` }}>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        mber-500"
        />
      </div>

      {selectedMonth && (() => {
        const [year, month] = selectedMonth.split('-');
        const monthlyDeposits = [];
        
        filteredBelievers.forEach(believer => {
          if (believer.deposits && believer.deposits.length > 0) {
            believer.deposits.forEach(deposit => {
              if (deposit.date.startsWith(selectedMonth)) {
                monthlyDeposits.push({
                  ...deposit,
                  believerName: believer.name,
                  believerPhone: believer.phone,
                  believerId: believer.id
                });
              }
            });
          }
        });

        monthlyDeposits.sort((a, b) => new Date(a.date) - new Date(b.date));
        const totalAmount = monthlyDeposits.reduce((sum, d) => sum + parseInt(d.amount || 0), 0);

        return (
          <div>
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💰</span>
                  <div>
                    <p className="text-sm text-gray-600">{year}년 {month}월</p>
                    <p className="text-lg font-bold text-gray-800">총 입금액</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-600">
                    {formatNumber(totalAmount)}
                    <span className="text-base ml-1">{totalAmount >= 10000 ? '원' : '만원'}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{monthlyDeposits.length}건</p>
                </div>
              </div>
            </div>

            {monthlyDeposits.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">해당 월의 입금내역이 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-green-100 to-emerald-100 border-b-2 border-green-300">
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-800">날짜</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-800">신도명</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-800">입금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyDeposits.map((deposit, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-green-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                          {new Date(deposit.date).toLocaleDateString('ko-KR', { 
                            month: 'long', 
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{deposit.believerName}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                          {formatNumber(deposit.amount)}{parseInt(deposit.amount) >= 10000 ? '원' : '만원'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-green-50 border-t-2 border-green-300">
                      <td colSpan="2" className="px-4 py-4 text-right font-bold text-gray-800">합계</td>
                      <td className="px-4 py-4 text-right font-bold text-green-600 text-lg">
                        {formatNumber(totalAmount)}{totalAmount >= 10000 ? '원' : '만원'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {!selectedMonth && (
        <div className="text-center py-12 text-gray-400">
          <span className="text-6xl mb-4 block">📅</span>
          <p className="text-lg">조회할 월을 선택해주세요</p>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button 
          onClick={() => { setShowMonthlyDepositPopup(false); setSelectedMonth(''); }}
          className="px-8 py-3 bg-gray-300 hover:bg-gray-400 rounded-lg font-bold transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
}
