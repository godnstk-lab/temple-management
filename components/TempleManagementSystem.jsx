import React, { useState, useEffect } from 'react';
import { Lock, LogOut, Plus, Trash2, Search, X } from 'lucide-react';
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

// 재사용 가능한 컴포넌트들
const PhotoUploadButtons = ({ onPhotoChange, show }) => {
  if (!show) return null;
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
};

const PhotoPreview = ({ src, onRemove }) => {
  if (!src) return null;
  return (
    <div className="mb-3 sm:mb-4 bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
      <div className="relative">
        <img src={src} alt="미리보기" className="w-full max-w-md mx-auto rounded-lg shadow-lg border-2 border-amber-300" />
        <button type="button" onClick={onRemove} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-center text-xs text-gray-500 mt-2">사진 선택됨 (×를 눌러 변경)</p>
    </div>
  );
};

const SizeSelector = ({ value, onChange }) => (
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
);

const FormInput = ({ label, required, className = '', ...props }) => (
  <div className={className}>
    <label className="block text-sm sm:text-base font-bold text-amber-900 mb-2">
      {label} {required && '*'}
    </label>
    <input
      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
      {...props}
    />
  </div>
);

const BulsaFormFields = ({ form, setForm }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
    <FormInput label="불사내용" type="text" value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} placeholder="예: 용두관음" />
    <FormInput label="불사금액 (만원)" type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} placeholder="0" />
    <FormInput label="봉안자/복위자" type="text" value={form.person} onChange={(e) => setForm({...form, person: e.target.value})} placeholder="OO생-홍길동" />
    <SizeSelector value={form.size} onChange={(size) => setForm({...form, size})} />
    <div className="md:col-span-2">
      <FormInput label="봉안위치" type="text" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder="예: 1층 동쪽" />
    </div>
  </div>
);

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
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [bulsaPhotoFile, setBulsaPhotoFile] = useState(null);
  const [bulsaPhotoPreview, setBulsaPhotoPreview] = useState(null);
  const [editBulsaPhotoFile, setEditBulsaPhotoFile] = useState(null);
  const [editBulsaPhotoPreview, setEditBulsaPhotoPreview] = useState(null);
  const [viewPhotoModal, setViewPhotoModal] = useState(false);
  const [viewPhotoUrl, setViewPhotoUrl] = useState('');
  
  const emptyForm = { name: '', phone: '', address: '', bulsa: [], deposits: [], unpaid: '' };
  const emptyBulsa = { content: '', amount: '', person: '', size: '', location: '', photoURL: '' };
  const emptyDeposit = { date: '', amount: '' };
  
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

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('📱 홈 화면에 추가하는 방법:\n\niPhone (Safari):\n1. 하단 공유 버튼 (□↑) 탭\n2. "홈 화면에 추가" 선택\n3. "추가" 탭\n\nAndroid (Chrome):\n1. 우측 상단 점 3개 (⋮) 탭\n2. "홈 화면에 추가" 선택\n3. "추가" 탭');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallButton(false);
    setDeferredPrompt(null);
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

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  const handlePhotoChange = (e, setter, previewSetter) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      setter(file);
      const reader = new FileReader();
      reader.onloadend = () => previewSetter(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (file, believerId, isBulsa = false, bulsaId = null) => {
    try {
      const timestamp = Date.now();
      const fileName = isBulsa ? `bulsa_${bulsaId}_${timestamp}.jpg` : `${timestamp}.jpg`;
      const path = isBulsa ? `believers/${believerId}/bulsa/${fileName}` : `believers/${believerId}/${fileName}`;
      const photoRef = storageRef(storage, path);
      await uploadBytes(photoRef, file);
      return await getDownloadURL(photoRef);
    } catch (error) {
      console.error('사진 업로드 실패:', error);
      throw error;
    }
  };
  
  const calcTotals = (bulsa, deposits) => {
    const totalBulsa = (bulsa || []).reduce((sum, item) => sum + parseInt(item.amount || 0), 0);
    const totalDeposit = (deposits || []).reduce((sum, item) => sum + parseInt(item.amount || 0), 0);
    return { totalBulsa, totalDeposit, unpaid: String(totalBulsa - totalDeposit) };
  };
  
  const formatNumber = (num) => num ? parseInt(num).toLocaleString() : '0';
  const getTotalBulsaAmount = (bulsa) => (bulsa || []).reduce((sum, b) => sum + parseInt(b.amount || 0), 0);
  const getTotalDepositAmount = (deposits) => (deposits || []).reduce((sum, d) => sum + parseInt(d.amount || 0), 0);

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
        let bulsaPhotoURL = '';
        if (photoFile) {
          bulsaPhotoURL = await uploadPhoto(photoFile, believerId);
        }
        bulsaArray = [{ ...newBulsaData, photoURL: bulsaPhotoURL }];
      }
      
      const { unpaid } = calcTotals(bulsaArray, []);
      const newBeliever = { id: believerId, ...formData, bulsa: bulsaArray, deposits: [], unpaid };
      
      const updatedBelievers = [...believers, newBeliever];
      setBelievers(updatedBelievers);
      await saveBelievers(updatedBelievers);
      alert('새 신도가 추가되었습니다.');
      setFormData(emptyForm);
      setNewBulsaData(emptyBulsa);
      setPhotoFile(null);
      setPhotoPreview(null);
      setShowAddForm(false);
    } catch (error) {
      alert('신도 추가에 실패했습니다: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (believer) => {
    setSelectedBeliever(believer);
    setFormData({ ...believer, bulsa: believer.bulsa || [], deposits: believer.deposits || [], unpaid: believer.unpaid || '' });
    setShowEditPopup(true);
  };

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

  const handleDelete = (believer) => {
    setSelectedBeliever(believer);
    setShowDeletePopup(true);
  };

  const confirmDelete = () => {
    const updatedBelievers = believers.filter(b => b.id !== selectedBeliever.id);
    setBelievers(updatedBelievers);
    saveBelievers(updatedBelievers);
    alert('삭제되었습니다.');
    setShowDeletePopup(false);
    setSelectedBeliever(null);
  };

  const openBulsaPopup = (believer) => {
    setSelectedBeliever(believer);
    setBulsaForm(emptyBulsa);
    setBulsaPhotoFile(null);
    setBulsaPhotoPreview(null);
    setShowBulsaPopup(true);
  };

  const addBulsa = async () => {
    if (!bulsaForm.content || !bulsaForm.amount) {
      alert('불사내용, 불사금액은 필수입니다.');
      return;
    }
    try {
      let bulsaPhotoURL = '';
      if (bulsaPhotoFile) {
        const bulsaId = Date.now().toString();
        bulsaPhotoURL = await uploadPhoto(bulsaPhotoFile, selectedBeliever.id, true, bulsaId);
      }
      const updatedBelievers = believers.map(b => {
        if (b.id === selectedBeliever.id) {
          const newBulsa = [...(b.bulsa || []), { ...bulsaForm, photoURL: bulsaPhotoURL }];
          const { unpaid } = calcTotals(newBulsa, b.deposits || []);
          return { ...b, bulsa: newBulsa, unpaid };
        }
        return b;
      });
      setBelievers(updatedBelievers);
      await saveBelievers(updatedBelievers);
      setSelectedBeliever(updatedBelievers.find(b => b.id === selectedBeliever.id));
      alert('불사내용이 추가되었습니다.');
      setBulsaForm(emptyBulsa);
      setBulsaPhotoFile(null);
      setBulsaPhotoPreview(null);
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
    setEditBulsaForm({ ...selectedBeliever.bulsa[index] });
    setEditBulsaPhotoFile(null);
    setEditBulsaPhotoPreview(null);
    setShowBulsaEditPopup(true);
  };

  const confirmBulsaEdit = async () => {
    if (!editBulsaForm.content || !editBulsaForm.amount) {
      alert('불사내용, 불사금액은 필수입니다.');
      return;
    }
    try {
      let updatedPhotoURL = editBulsaForm.photoURL || '';
      if (editBulsaPhotoFile) {
        const bulsaId = Date.now().toString();
        updatedPhotoURL = await uploadPhoto(editBulsaPhotoFile, selectedBeliever.id, true, bulsaId);
      }
      const updatedBelievers = believers.map(b => {
        if (b.id === selectedBeliever.id) {
          const newBulsa = [...b.bulsa];
          newBulsa[editingBulsaIndex] = { ...editBulsaForm, photoURL: updatedPhotoURL };
          const { unpaid } = calcTotals(newBulsa, b.deposits || []);
          return { ...b, bulsa: newBulsa, unpaid };
        }
        return b;
      });
      setBelievers(updatedBelievers);
      await saveBelievers(updatedBelievers);
      setSelectedBeliever(updatedBelievers.find(b => b.id === selectedBeliever.id));
      alert('불사내용이 수정되었습니다.');
      setShowBulsaEditPopup(false);
      setEditingBulsaIndex(null);
      setEditBulsaForm(emptyBulsa);
      setEditBulsaPhotoFile(null);
      setEditBulsaPhotoPreview(null);
    } catch (error) {
      alert('불사 수정 실패: ' + error.message);
    }
  };

  const openDepositPopup = (believer) => {
    setSelectedBeliever(believer);
    setDepositForm(emptyDeposit);
    setShowDepositPopup(true);
  };

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

  const filteredBelievers = believers.filter(b => {
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

  const searchTotals = filteredBelievers.reduce((totals, believer) => {
    const bulsaTotal = getTotalBulsaAmount(believer.bulsa || []);
    const depositTotal = getTotalDepositAmount(believer.deposits || []);
    const unpaidTotal = parseInt(believer.unpaid || 0);
    return {
      totalBulsa: totals.totalBulsa + bulsaTotal,
      totalDeposit: totals.totalDeposit + depositTotal,
      totalUnpaid: totals.totalUnpaid + unpaidTotal
    };
  }, { totalBulsa: 0, totalDeposit: 0, totalUnpaid: 0 });

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
                <button onClick={() => { setShowAddForm(true); setFormData(emptyForm); setNewBulsaData(emptyBulsa); }} className="flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-amber-600 to-orange-700 text-white font-bold rounded-lg hover:from-amber-700 hover:to-orange-800 transition-all shadow-md whitespace-nowrap text-sm sm:text-base">
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
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-amber-900 whitespace-nowrap">불사내용</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-amber-900 whitespace-nowrap">입금액</th>
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
                              <button onClick={() => handleEdit(believer)} className="text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer">{believer.name}</button>
                            ) : (
                              <span>{believer.name}</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-2 text-xs sm:text-sm whitespace-nowrap">
                            <button onClick={() => openBulsaPopup(believer)} className="text-blue-600 hover:text-blue-800 font-semibold underline">
                              {believer.bulsa && believer.bulsa.length > 0 ? (
                                <div className="flex flex-col items-start leading-tight">
                                  <span className="text-sm font-bold">{formatNumber(getTotalBulsaAmount(believer.bulsa))}만</span>
                                  <span className="text-xs text-gray-500">{believer.bulsa.length}건</span>
                                </div>
                              ) : '없음'}
                            </button>
                          </td>
                          <td className="px-3 sm:px-6 py-2 text-xs sm:text-sm whitespace-nowrap">
                            <button onClick={() => openDepositPopup(believer)} className="text-green-600 hover:text-green-800 font-semibold underline">
                              {believer.deposits && believer.deposits.length > 0 ? (
                                <div className="flex flex-col items-start leading-tight">
                                  <span className="text-sm font-bold">{formatNumber(getTotalDepositAmount(believer.deposits))}만</span>
                                  <span className="text-xs text-gray-500">{believer.deposits.length}건</span>
                                </div>
                              ) : '없음'}
                            </button>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-right text-red-600 font-bold whitespace-nowrap">
                            {formatNumber(believer.unpaid)}만
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
              <h3 className="text-sm sm:text-lg font-bold text-amber-900 mb-3 sm:mb-4">📊 검색 결과 총합계 ({filteredBelievers.length}명)</h3>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl">🙏</span>
                      <span className="text-sm sm:text-base font-bold text-gray-700">총 불사금액</span>
                    </div>
                    <div className="text-xl sm:text-3xl font-bold text-blue-600">
                      {formatNumber(searchTotals.totalBulsa)}
                      <span className="text-sm sm:text-base ml-1">만원</span>
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
                      <span className="text-sm sm:text-base ml-1">만원</span>
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
                      <span className="text-sm sm:text-base ml-1">만원</span>
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

        {/* 신도 추가 폼 */}
        {showAddForm && userRole === 'admin' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto pt-16 sm:pt-8">
            <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 w-full max-w-4xl mb-8 overflow-y-auto max-h-[85vh] sm:max-h-[90vh]">
              <h2 className="text-xl sm:text-2xl font-bold text-amber-900 mb-4 sm:mb-6">신도 추가</h2>
              
              <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b-2 border-amber-200">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-amber-800">기본 정보</h3>
                  <PhotoUploadButtons onPhotoChange={(e) => handlePhotoChange(e, setPhotoFile, setPhotoPreview)} show={!photoPreview} />
                </div>

                <PhotoPreview src={photoPreview} onRemove={() => { setPhotoFile(null); setPhotoPreview(null); }} />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  <FormInput label="이름" required type="text" name="name" value={formData.name} onChange={handleInputChange} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.querySelector('input[name="phone"]').focus(); }}} />
                  <FormInput label="전화번호" required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="010-0000-0000" onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.querySelector('input[name="address"]').focus(); }}} />
                  <FormInput label="주소" type="text" name="address" value={formData.address} onChange={handleInputChange} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.querySelector('input[placeholder="예: 용두관음"]').focus(); }}} />
                </div>
              </div>

              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold text-amber-800 mb-3 sm:mb-4">불사 정보 (선택사항)</h3>
                <BulsaFormFields form={newBulsaData} setForm={setNewBulsaData} />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
                <button onClick={handleAddBeliever} disabled={isUploading} className="flex-1 bg-gradient-to-r from-amber-600 to-orange-700 text-white font-bold py-3.5 sm:py-3 text-base sm:text-lg rounded-lg hover:from-amber-700 hover:to-orange-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {isUploading ? '업로드 중...' : '추가하기'}
                </button>
                <button onClick={() => { setShowAddForm(false); setPhotoFile(null); setPhotoPreview(null); }} className="sm:px-8 py-3.5 sm:py-3 text-base sm:text-lg bg-gray-300 hover:bg-gray-400 rounded-lg transition-colors font-bold">
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 불사내용 팝업 */}
        {showBulsaPopup && selectedBeliever && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 w-full max-w-4xl my-4 overflow-y-auto max-h-[95vh]">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-amber-900">{selectedBeliever.name}님 불사내용</h2>
                <button onClick={() => setShowBulsaPopup(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {selectedBeliever.bulsa && selectedBeliever.bulsa.length > 0 && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
                  <h3 className="font-bold text-amber-900 mb-3 text-sm sm:text-base">등록된 불사내용</h3>
                  {selectedBeliever.bulsa.map((b, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-amber-200 last:border-0">
                      <div className="flex items-center gap-2 flex-1">
                        {b.photoURL ? (
                          <img src={b.photoURL} alt="불사 사진" onClick={() => { setViewPhotoUrl(b.photoURL); setViewPhotoModal(true); }} className="w-8 h-8 rounded object-cover border-2 border-amber-400 shadow-sm cursor-pointer hover:scale-110 transition-transform flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg text-gray-400">📷</span>
                          </div>
                        )}
                        <div className="flex-1">
                          {b.size && <span className="text-amber-700 font-bold text-sm sm:text-base">[{b.size}]</span>}
                          <span className="font-semibold text-gray-800 text-sm sm:text-base ml-2">{b.content}</span>
                          <span className="text-gray-600 ml-2 sm:ml-4 text-xs sm:text-sm">{formatNumber(b.amount)}만원</span>
                          <span className="text-gray-600 ml-2 sm:ml-4 text-xs sm:text-sm">({b.person})</span>
                          {b.location && <span className="text-gray-600 ml-1 sm:ml-2 text-xs sm:text-sm">위치: {b.location}</span>}
                        </div>
                      </div>
                      {userRole === 'admin' && (
                        <div className="flex gap-2">
                          <button onClick={() => openBulsaEditPopup(idx)} className="px-3 sm:px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-bold rounded transition-colors">수정</button>
                          <button onClick={() => deleteBulsa(selectedBeliever.id, idx)} className="px-3 sm:px-4 py-1 bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-bold rounded transition-colors">삭제</button>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="mt-3 pt-3 border-t-2 border-amber-300">
                    <span className="font-bold text-amber-900 text-sm sm:text-base">총 불사금액: </span>
                    <span className="font-bold text-blue-600 text-base sm:text-lg">{formatNumber(getTotalBulsaAmount(selectedBeliever.bulsa))}만원</span>
                  </div>
                </div>
              )}

              {userRole === 'admin' && (
                <>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="font-bold text-amber-900 text-sm sm:text-base">새 불사내용 추가</h3>
                    <PhotoUploadButtons onPhotoChange={(e) => handlePhotoChange(e, setBulsaPhotoFile, setBulsaPhotoPreview)} show={!bulsaPhotoPreview} />
                  </div>

                  <PhotoPreview src={bulsaPhotoPreview} onRemove={() => { setBulsaPhotoFile(null); setBulsaPhotoPreview(null); }} />
                  <BulsaFormFields form={bulsaForm} setForm={setBulsaForm} />

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button onClick={addBulsa} className="flex-1 bg-gradient-to-r from-amber-600 to-orange-700 text-white font-bold py-3 text-sm sm:text-base rounded-lg hover:from-amber-700 hover:to-orange-800 transition-all">추가하기</button>
                    <button onClick={() => setShowBulsaPopup(false)} className="sm:px-8 py-3 text-sm sm:text-base bg-gray-300 hover:bg-gray-400 rounded-lg font-bold">닫기</button>
                  </div>
                </>
              )}

              {userRole !== 'admin' && (
                <button onClick={() => setShowBulsaPopup(false)} className="w-full px-8 py-3 text-sm sm:text-base bg-gray-300 hover:bg-gray-400 rounded-lg font-bold">닫기</button>
              )}
            </div>
          </div>
        )}

        {/* 불사내용 수정 팝업 */}
        {showBulsaEditPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 w-full max-w-4xl my-4 overflow-y-auto max-h-[95vh]">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-amber-900">불사내용 수정</h2>
                <button onClick={() => { setShowBulsaEditPopup(false); setEditingBulsaIndex(null); setEditBulsaForm(emptyBulsa); setEditBulsaPhotoFile(null); setEditBulsaPhotoPreview(null); }} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-amber-900 text-sm">사진</h3>
                  <PhotoUploadButtons onPhotoChange={(e) => handlePhotoChange(e, setEditBulsaPhotoFile, setEditBulsaPhotoPreview)} show={!editBulsaPhotoPreview && !editBulsaForm.photoURL} />
                </div>

                {(editBulsaPhotoPreview || editBulsaForm.photoURL) && (
                  <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                    <div className="relative">
                      <img src={editBulsaPhotoPreview || editBulsaForm.photoURL} alt="불사 사진" className="w-full max-w-md mx-auto rounded-lg shadow-lg border-2 border-blue-300" />
                      <button type="button" onClick={() => { setEditBulsaPhotoFile(null); setEditBulsaPhotoPreview(null); setEditBulsaForm({...editBulsaForm, photoURL: ''}); }} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-2">
                      {editBulsaPhotoPreview ? '새 사진 선택됨' : '기존 사진'} (×를 눌러 {editBulsaPhotoPreview ? '변경' : '삭제'})
                    </p>
                  </div>
                )}
              </div>

              <BulsaFormFields form={editBulsaForm} setForm={setEditBulsaForm} />

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button onClick={confirmBulsaEdit} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 text-sm sm:text-base rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all">수정 완료</button>
                <button onClick={() => { setShowBulsaEditPopup(false); setEditingBulsaIndex(null); setEditBulsaForm(emptyBulsa); setEditBulsaPhotoFile(null); setEditBulsaPhotoPreview(null); }} className="sm:px-8 py-3 text-sm sm:text-base bg-gray-300 hover:bg-gray-400 rounded-lg font-bold">취소</button>
              </div>
            </div>
          </div>
        )}

        {/* 입금내역 팝업 */}
        {showDepositPopup && selectedBeliever && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-amber-900">{selectedBeliever.name}님 입금내역</h2>
                <button onClick={() => setShowDepositPopup(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {selectedBeliever.deposits && selectedBeliever.deposits.length > 0 && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <h3 className="font-bold text-green-900 mb-3">등록된 입금내역</h3>
                  {selectedBeliever.deposits.map((d, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-green-200 last:border-0">
                      <div className="flex-1">
                        <span className="font-semibold text-gray-800">{d.date}</span>
                        <span className="text-gray-600 ml-6">{formatNumber(d.amount)}만원</span>
                      </div>
                      {userRole === 'admin' && (
                        <button onClick={() => deleteDeposit(selectedBeliever.id, idx)} className="px-4 py-1 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded transition-colors ml-4">삭제</button>
                      )}
                    </div>
                  ))}
                  <div className="mt-3 pt-3 border-t-2 border-green-300">
                    <span className="font-bold text-green-900">총 입금액: </span>
                    <span className="font-bold text-green-600 text-lg">{formatNumber(getTotalDepositAmount(selectedBeliever.deposits))}만원</span>
                  </div>
                </div>
              )}

              {userRole === 'admin' && (
                <>
                  <h3 className="font-bold text-green-900 mb-4">새 입금내역 추가</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <FormInput label="날짜" type="date" value={depositForm.date} onChange={(e) => setDepositForm({...depositForm, date: e.target.value})} />
                    <FormInput label="금액 (만원)" type="number" value={depositForm.amount} onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})} placeholder="0" />
                  </div>

                  <div className="flex gap-4">
                    <button onClick={addDeposit} className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all">추가하기</button>
                    <button onClick={() => setShowDepositPopup(false)} className="px-8 py-3 bg-gray-300 hover:bg-gray-400 rounded-lg font-bold">닫기</button>
                  </div>
                </>
              )}

              {userRole !== 'admin' && (
                <button onClick={() => setShowDepositPopup(false)} className="w-full px-8 py-3 bg-gray-300 hover:bg-gray-400 rounded-lg font-bold">닫기</button>
              )}
            </div>
          </div>
        )}

        {/* 신도 정보 수정 팝업 */}
        {showEditPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-amber-900 mb-6">신도 정보 수정</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <FormInput label="이름" required type="text" name="name" value={formData.name} onChange={handleInputChange} />
                <FormInput label="전화번호" required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} />
                <FormInput label="주소" className="col-span-2" type="text" name="address" value={formData.address} onChange={handleInputChange} />
              </div>

              <div className="flex gap-4">
                <button onClick={confirmEdit} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all">수정 완료</button>
                <button onClick={() => { setShowEditPopup(false); setSelectedBeliever(null); }} className="px-8 py-3 bg-gray-300 hover:bg-gray-400 rounded-lg font-bold">취소</button>
              </div>
            </div>
          </div>
        )}

        {/* 삭제 확인 팝업 */}
        {showDeletePopup && selectedBeliever && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">신도 삭제</h2>
                <p className="text-gray-600">정말 삭제하시겠습니까?</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">삭제할 신도 정보:</p>
                <p className="font-bold text-lg text-gray-800">{selectedBeliever.name}</p>
                <p className="text-sm text-gray-600">{selectedBeliever.phone}</p>
              </div>

              <div className="flex gap-4">
                <button onClick={confirmDelete} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all">삭제하기</button>
                <button onClick={() => { setShowDeletePopup(false); setSelectedBeliever(null); }} className="px-8 py-3 bg-gray-300 hover:bg-gray-400 rounded-lg font-bold">취소</button>
              </div>
            </div>
          </div>
        )}

        {/* 사진 크게 보기 모달 */}
        {viewPhotoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50" onClick={() => setViewPhotoModal(false)}>
            <div className="relative max-w-4xl w-full">
              <img src={viewPhotoUrl} alt="불사 사진 확대" className="w-full rounded-lg shadow-2xl" />
              <button onClick={() => setViewPhotoModal(false)} className="absolute top-4 right-4 bg-white text-black rounded-full p-2 shadow-lg hover:bg-gray-100 transition">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
