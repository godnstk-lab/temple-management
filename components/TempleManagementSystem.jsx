import React, { useState, useEffect } from 'react';
import { Lock, LogOut, Plus, Trash2, Search, X } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

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

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

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
  
  const emptyForm = { name: '', phone: '', address: '', bulsa: [], deposits: [], unpaid: '' };
  const emptyBulsa = { content: '', amount: '', person: '', size: '', location: '' };
  const emptyDeposit = { date: '', amount: '' };
  
  const [formData, setFormData] = useState(emptyForm);
  const [newBulsaData, setNewBulsaData] = useState(emptyBulsa);
  const [bulsaForm, setBulsaForm] = useState(emptyBulsa);
  const [depositForm, setDepositForm] = useState(emptyDeposit);

  useEffect(() => {
    // Firebase 실시간 리스너 설정
    const believersRef = ref(database, 'believers');
    const unsubscribe = onValue(believersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const believersArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setBelievers(believersArray);
      } else {
        setBelievers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const saveBelievers = async (newBelievers) => {
    try {
      const believersRef = ref(database, 'believers');
      const believersObj = {};
      newBelievers.forEach(believer => {
        believersObj[believer.id] = believer;
      });
      await set(believersRef, believersObj);
    } catch (error) {
      console.error('저장 실패:', error);
      alert('데이터 저장에 실패했습니다.');
    }
  };

  const handleLogin = () => {
    if (loginPassword === '0804') {
      setIsLoggedIn(true);
      setUserRole('admin');
      alert('관리자로 로그인되었습니다.');
    } else if (loginPassword === '1211') {
      setIsLoggedIn(true);
      setUserRole('user');
      alert('일반 사용자로 로그인되었습니다.');
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
  
  const calcTotals = (bulsa, deposits) => {
    const totalBulsa = (bulsa || []).reduce((sum, item) => sum + parseInt(item.amount || 0), 0);
    const totalDeposit = (deposits || []).reduce((sum, item) => sum + parseInt(item.amount || 0), 0);
    return { totalBulsa, totalDeposit, unpaid: String(totalBulsa - totalDeposit) };
  };
  
  const formatNumber = (num) => num ? parseInt(num).toLocaleString() : '0';
  const truncateAddress = (addr) => !addr ? '' : addr.length > 10 ? addr.substring(0, 10) + '...' : addr;

  const handleAddBeliever = () => {
    if (!formData.name || !formData.phone) {
      alert('이름과 전화번호는 필수입니다.');
      return;
    }
    
    const bulsaArray = newBulsaData.content && newBulsaData.amount && newBulsaData.person 
      ? [{ ...newBulsaData }] : [];
    
    const { unpaid } = calcTotals(bulsaArray, []);
    const newBeliever = { id: Date.now().toString(), ...formData, bulsa: bulsaArray, deposits: [], unpaid };
    
    const updatedBelievers = [...believers, newBeliever];
    setBelievers(updatedBelievers);
    saveBelievers(updatedBelievers);
    alert('새 신도가 추가되었습니다.');
    
    setFormData(emptyForm);
    setNewBulsaData(emptyBulsa);
    setShowAddForm(false);
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
    setShowBulsaPopup(true);
  };

  const addBulsa = () => {
    if (!bulsaForm.content || !bulsaForm.amount || !bulsaForm.person) {
      alert('불사내용, 불사금액, 봉안자/복위자는 필수입니다.');
      return;
    }
    
    const updatedBelievers = believers.map(b => {
      if (b.id === selectedBeliever.id) {
        const newBulsa = [...(b.bulsa || []), { ...bulsaForm }];
        const { unpaid } = calcTotals(newBulsa, b.deposits || []);
        return { ...b, bulsa: newBulsa, unpaid };
      }
      return b;
    });
    
    setBelievers(updatedBelievers);
    saveBelievers(updatedBelievers);
    setSelectedBeliever(updatedBelievers.find(b => b.id === selectedBeliever.id));
    alert('불사내용이 추가되었습니다.');
    setBulsaForm(emptyBulsa);
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

  const getTotalBulsaAmount = (bulsa) => (bulsa || []).reduce((sum, b) => sum + parseInt(b.amount || 0), 0);
  const getTotalDepositAmount = (deposits) => (deposits || []).reduce((sum, d) => sum + parseInt(d.amount || 0), 0);

  const filteredBelievers = believers.filter(b => {
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    const bulsaText = (b.bulsa || []).map(item => (item.content || '').toLowerCase()).join(' ');
    return (b.name || '').toLowerCase().includes(lower) || (b.phone || '').includes(searchTerm) || bulsaText.includes(lower);
  });

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
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
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-900 via-orange-800 to-amber-900 bg-clip-text text-transparent mb-2" style={{fontFamily: 'serif'}}>
                海雲寺
              </h1>
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
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="relative w-full pl-12 pr-4 py-4 border-2 border-amber-300/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white/80 backdrop-blur-sm text-center text-lg shadow-lg transition-all"
                  placeholder="••••"
                />
              </div>
            </div>

            <button
              onClick={handleLogin}
              className="relative w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white font-bold py-4 rounded-xl shadow-xl text-lg overflow-hidden group transition-all hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="relative">입장하기</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 나머지 UI 코드는 동일...
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* 전체 UI는 이전 코드와 동일하므로 생략 */}
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold text-amber-900">해운사 신도관리 시스템</h1>
        <p className="mt-4 text-lg text-gray-700">Firebase 연결 준비 완료</p>
        <p className="mt-2 text-sm text-gray-500">Firebase 설정을 완료하면 정상 작동합니다.</p>
      </div>
    </div>
  );
}
