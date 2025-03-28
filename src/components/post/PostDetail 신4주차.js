import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Edit, Trash, ArrowLeft, User } from 'lucide-react';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isOwner, setIsOwner] = useState(false);

  // 현재 게시물의 찜 상태를 확인하는 함수
  const checkWishlistStatus = async (token, postId) => {
    try {
      // 위시리스트 목록 가져오기
      const response = await fetch('/api/wishlist/getmywishlist', {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('위시리스트 조회 실패');
        return false;
      }

      const wishlistItems = await response.json();
      
      // 현재 게시물이 위시리스트에 있는지 확인
      const isInWishlist = Array.isArray(wishlistItems) && 
        wishlistItems.some(item => item.post && item.post.id === parseInt(postId));
      
      console.log(`게시물 ${postId}의 찜 상태:`, isInWishlist);
      return isInWishlist;
    } catch (error) {
      console.error('위시리스트 상태 확인 오류:', error);
      return false;
    }
  };

  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        // 로그인 확인
        const token = localStorage.getItem('jwtToken');
        const userId = localStorage.getItem('userId');
        
        if (!token) {
          navigate('/signin');
          return;
        }

        setIsLoading(true);
        const response = await fetch(`/api/post/${postId}`, {
          method: 'GET',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('게시물을 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        setPost(data);
        
        // 현재 사용자가 게시물 작성자인지 확인
        setIsOwner(data.user?.id === parseInt(userId));
        
        // 찜 상태 확인
        const wishlistStatus = await checkWishlistStatus(token, postId);
        setIsLiked(wishlistStatus);
      } catch (error) {
        console.error('게시물 상세 조회 오류:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostDetail();
  }, [postId, navigate]);

  const handleLikeToggle = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      
      console.log(`위시리스트 ${isLiked ? '제거' : '추가'} 요청:`, post.id);
      
      const response = await fetch(`/api/wishlist/${post.id}`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // 찜하기 상태 토글
        setIsLiked(!isLiked);
        
        // 위시리스트 카운트 업데이트
        setPost(prev => ({
          ...prev,
          wishlistCount: isLiked ? Math.max(0, prev.wishlistCount - 1) : prev.wishlistCount + 1
        }));
        
        console.log(`위시리스트 ${isLiked ? '제거' : '추가'} 성공`);
      } else {
        const errorData = await response.text();
        console.error('위시리스트 처리 실패:', errorData);
      }
    } catch (error) {
      console.error('위시리스트 처리 오류:', error);
    }
  };

  const handleEdit = () => {
    navigate(`/posts/edit/${postId}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 이 게시물을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('jwtToken');
      
      const response = await fetch(`/api/post/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });

      if (response.ok) {
        alert('게시물이 삭제되었습니다.');
        navigate('/posts');
      } else {
        const errorData = await response.text();
        alert(`삭제 실패: ${errorData}`);
      }
    } catch (error) {
      console.error('게시물 삭제 오류:', error);
      alert(`오류가 발생했습니다: ${error.message}`);
    }
  };

  const handleImageChange = (direction) => {
    if (!post?.images || post.images.length <= 1) return;
    
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % post.images.length);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + post.images.length) % post.images.length);
    }
  };

  const handleGoBack = () => {
    navigate('/posts');
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
          onClick={handleGoBack}
          className="mt-4 flex items-center text-blue-500 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-4">
        <div className="text-center py-8">게시물을 찾을 수 없습니다.</div>
        <button 
          onClick={handleGoBack}
          className="flex items-center text-blue-500 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const statusLabel = getStatusLabel(post.status);

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4">
      <button 
        onClick={handleGoBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-5 h-5 mr-1" />
        목록으로 돌아가기
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* 이미지 섹션 */}
        <div className="relative h-96 bg-gray-100">
          {post.images && post.images.length > 0 ? (
            <>
              <img
                src={`/images/${post.images[currentImageIndex].imageUrl}`}
                alt={post.title}
                className="w-full h-full object-contain"
              />
              
              {/* 이미지가 여러 개인 경우 좌우 화살표 표시 */}
              {post.images.length > 1 && (
                <>
                  <button
                    onClick={() => handleImageChange('prev')}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
                  >
                    &lt;
                  </button>
                  <button
                    onClick={() => handleImageChange('next')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
                  >
                    &gt;
                  </button>
                  
                  {/* 이미지 인디케이터 */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                    {post.images.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      ></div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              이미지가 없습니다
            </div>
          )}
        </div>

        {/* 게시물 내용 */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center mb-2">
                <span className={`text-xs px-2 py-1 rounded-full ${statusLabel.class}`}>
                  {statusLabel.text}
                </span>
                <h1 className="text-2xl font-bold ml-2">{post.title}</h1>
              </div>
              <p className="text-xl font-semibold text-blue-600">
                {formatPrice(post.price)}
              </p>
            </div>
            
            {/* 위시리스트(찜) 버튼 */}
            <button
              onClick={handleLikeToggle}
              className={`p-2 rounded-full ${
                isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-500'
              }`}
              title={isLiked ? '위시리스트에서 제거' : '위시리스트에 추가'}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>
          
          {/* 작성자 정보 */}
          <div className="flex items-center mb-4 text-sm text-gray-500">
            <User className="w-4 h-4 mr-1" />
            <span>{post.user?.nickname || '익명'}</span>
            <span className="mx-2">•</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            <span className="mx-2">•</span>
            <span>조회 {post.viewCount}</span>
            <span className="mx-2">•</span>
            <span>찜 {post.wishlistCount}</span>
          </div>
          
          <hr className="my-4" />
          
          {/* 본문 내용 */}
          <div className="whitespace-pre-line mt-4 min-h-48">
            {post.content}
          </div>
          
          <hr className="my-6" />
          
          {/* 수정/삭제 버튼 (작성자만 표시) */}
          {isOwner && (
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={handleEdit}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <Edit className="w-4 h-4 mr-1" />
                수정
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <Trash className="w-4 h-4 mr-1" />
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;