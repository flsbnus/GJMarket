import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Search, X } from 'lucide-react';

const WishlistManagement = () => {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        // 로그인 확인
        const token = localStorage.getItem('jwtToken');
        const userId = localStorage.getItem('userId');
        
        if (!token) {
          navigate('/signin');
          return;
        }

        setIsLoading(true);
        const response = await fetch('/api/wishlist/getmywishlist', {
          method: 'GET',
          headers: {
            'Authorization': `${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('위시리스트를 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        setWishlistItems(data);
        setFilteredItems(data);
      } catch (error) {
        console.error('위시리스트 조회 오류:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  useEffect(() => {
    // 검색어에 따라 아이템 필터링
    if (searchTerm.trim() === '') {
      setFilteredItems(wishlistItems);
    } else {
      const filtered = wishlistItems.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (item.content && item.content.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, wishlistItems]);

  const handleRemoveFromWishlist = async (postId) => {
    if (window.confirm('정말 위시리스트에서 삭제하시겠습니까?')) {
      try {
        const token = localStorage.getItem('jwtToken');
        
        const response = await fetch(`/api/wishlist/${postId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          // 위시리스트에서 해당 아이템 제거
          setWishlistItems(prevItems => prevItems.filter(item => item.id !== postId));
        } else {
          const errorData = await response.text();
          alert(`위시리스트 제거 실패: ${errorData}`);
        }
      } catch (error) {
        console.error('위시리스트 제거 오류:', error);
        alert(`오류가 발생했습니다: ${error.message}`);
      }
    }
  };

  // 가격 형식화 (1000 -> 1,000원)
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '가격 정보 없음';
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  // 판매 상태 표시
  const getStatusLabel = (status) => {
    switch(status) {
      case 0: return { text: '판매중', class: 'bg-green-100 text-green-800' };
      case 1: return { text: '예약중', class: 'bg-yellow-100 text-yellow-800' };
      case 2: return { text: '판매완료', class: 'bg-gray-100 text-gray-800' };
      default: return { text: '상태 불명', class: 'bg-gray-100 text-gray-500' };
    }
  };

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const goToPostDetail = (postId) => {
    navigate(`/post/${postId}`);
  };

  const goBack = () => {
    navigate('/posts');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-4">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg text-center">
          {error}
        </div>
        <button 
          onClick={goBack}
          className="mt-4 flex items-center text-blue-500 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button 
            onClick={goBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            목록으로
          </button>
          <h1 className="text-2xl font-bold">내 위시리스트</h1>
        </div>
        
        {/* 검색 기능 */}
        <div className="relative w-64">
          <input
            type="text"
            placeholder="검색어 입력..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Heart className="mx-auto w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">
            {searchTerm ? '검색 결과가 없습니다.' : '위시리스트에 추가된 상품이 없습니다.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-blue-500 hover:text-blue-700"
            >
              전체 위시리스트 보기
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden flex">
              {/* 이미지 */}
              <div className="w-1/3 bg-gray-100">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 상품 정보 */}
              <div className="w-2/3 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between">
                    <div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusLabel(item.status).class}`}>
                        {getStatusLabel(item.status).text}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveFromWishlist(item.id)}
                      className="text-red-500 hover:text-red-600"
                      aria-label="위시리스트에서 삭제"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                  
                  <h2 
                    className="text-lg font-semibold mt-2 cursor-pointer hover:text-blue-600 truncate"
                    onClick={() => goToPostDetail(item.id)}
                  >
                    {item.title}
                  </h2>
                  
                  <p className="text-blue-600 font-semibold mt-1">
                    {formatPrice(item.price)}
                  </p>
                </div>
                
                <div className="mt-2 text-sm text-gray-500 flex justify-between items-end">
                  <div>{item.user.nickname}</div>
                  <div>{formatDate(item.createdAt)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistManagement;