import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, StarHalf, StarOff } from 'lucide-react';
import { SERVER_URL } from '../../config';

const RatingManagement = () => {
  const navigate = useNavigate();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [recentChats, setRecentChats] = useState([]);

  useEffect(() => {
    fetchRatings();
    fetchRecentChats();
  }, []);

  const fetchRatings = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        navigate('/signin');
        return;
      }

      const [receivedResponse, sentResponse] = await Promise.all([
        fetch(`${SERVER_URL}/api/reviews/received`, {
          headers: {
            'Authorization': token
          }
        }),
        fetch(`${SERVER_URL}/api/reviews/sent`, {
          headers: {
            'Authorization': token
          }
        })
      ]);

      if (!receivedResponse.ok || !sentResponse.ok) {
        throw new Error('리뷰를 불러오는데 실패했습니다.');
      }

      const receivedData = await receivedResponse.json();
      const sentData = await sentResponse.json();
      
      setRatings([...receivedData, ...sentData]);
    } catch (error) {
      console.error('리뷰 로딩 오류:', error);
      setError('리뷰를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentChats = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        console.log('토큰이 없습니다.');
        return;
      }

      const userId = localStorage.getItem('userId');
      console.log('사용자 ID:', userId);
      
      const response = await fetch(`${SERVER_URL}/api/users/${userId}/chatrooms`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('채팅방을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      console.log('받아온 채팅방 데이터:', data);
      
      if (Array.isArray(data)) {
        const processedChats = data.map(chat => {
          const currentUserId = parseInt(userId);
          const isSeller = chat.seller?.id === currentUserId;
          const otherUser = isSeller ? chat.buyer : chat.seller;
          
          return {
            id: chat.id,
            postId: chat.postId,
            otherUserId: otherUser?.id,
            otherUserNickname: otherUser?.nickname,
            postTitle: chat.postTitle || '거래',
            lastMessageAt: chat.createdAt
          };
        });

        const validChats = processedChats.filter(chat => {
          const isValid = chat && chat.id && chat.postId && chat.otherUserId;
          if (!isValid) {
            console.warn('유효하지 않은 채팅방 데이터:', chat);
          }
          return isValid;
        });

        setRecentChats(validChats);
      } else {
        console.error('채팅방 데이터가 배열이 아닙니다:', data);
        setRecentChats([]);
      }
    } catch (error) {
      console.error('채팅방 로딩 오류:', error);
      setRecentChats([]);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRating || !reviewText.trim()) {
      setError('평점과 리뷰 내용을 모두 입력해주세요.');
      return;
    }

    if (!selectedPost || !selectedPost.postId || !selectedPost.targetUserId) {
      setError('리뷰를 작성할 거래 정보가 올바르지 않습니다.');
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken');
      const userId = localStorage.getItem('userId');

      console.log('리뷰 작성 요청:', {
        postId: selectedPost.postId,
        targetUserId: selectedPost.targetUserId,
        rating: selectedRating,
        review: reviewText
      });

      const response = await fetch(`${SERVER_URL}/api/posts/${selectedPost.postId}/reviews/${selectedPost.targetUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          rating: selectedRating,
          review: reviewText
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '리뷰 작성에 실패했습니다.');
      }

      setShowReviewModal(false);
      setSelectedRating(null);
      setReviewText('');
      setSelectedPost(null);
      fetchRatings();
    } catch (error) {
      console.error('리뷰 작성 오류:', error);
      setError(error.message || '리뷰를 작성할 수 없습니다.');
    }
  };

  const handleReviewDelete = async (reviewId) => {
    if (!window.confirm('리뷰를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(`${SERVER_URL}/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });

      if (!response.ok) {
        throw new Error('리뷰 삭제에 실패했습니다.');
      }

      fetchRatings();
    } catch (error) {
      console.error('리뷰 삭제 오류:', error);
      setError('리뷰를 삭제할 수 없습니다.');
    }
  };

  const handleReviewEdit = async (reviewId, newRating, newReview) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(`${SERVER_URL}/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          rating: newRating,
          review: newReview
        })
      });

      if (!response.ok) {
        throw new Error('리뷰 수정에 실패했습니다.');
      }

      fetchRatings();
    } catch (error) {
      console.error('리뷰 수정 오류:', error);
      setError('리뷰를 수정할 수 없습니다.');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<Star key={i} className="w-5 h-5 text-yellow-400" />);
      } else if (i - 0.5 <= rating) {
        stars.push(<StarHalf key={i} className="w-5 h-5 text-yellow-400" />);
      } else {
        stars.push(<StarOff key={i} className="w-5 h-5 text-gray-300" />);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">리뷰 관리</h1>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* 최근 채팅방 목록 */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center">
            <span className="mr-2">최근 채팅방</span>
            <span className="text-sm text-gray-500">(최근 30일)</span>
          </h2>
          <div className="grid gap-4">
            {recentChats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                최근 채팅방이 없습니다.
              </div>
            ) : (
              recentChats.map((chat) => (
                <div 
                  key={chat.id}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-blue-500 transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    if (!chat.postId || !chat.otherUserId) {
                      setError('리뷰를 작성할 수 없는 채팅방입니다.');
                      return;
                    }
                    setSelectedPost({
                      postId: chat.postId,
                      targetUserId: chat.otherUserId,
                      postTitle: chat.postTitle
                    });
                    setShowReviewModal(true);
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-lg text-gray-800">
                        {chat.postTitle}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {chat.otherUserNickname || '상대방'}님과의 거래
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(chat.lastMessageAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors duration-200 flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      리뷰 작성
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 기존 리뷰 목록 */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">작성한 리뷰</h2>
          <div className="grid gap-4">
            {ratings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                작성한 리뷰가 없습니다.
              </div>
            ) : (
              ratings.map((rating) => (
                <div key={rating.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="flex mr-2">
                        {renderStars(rating.rating)}
                      </div>
                      <span className="text-gray-600 text-sm">
                        {new Date(rating.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleReviewEdit(rating.id, rating.rating, rating.review)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleReviewDelete(rating.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{rating.review}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 리뷰 작성 모달 */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {selectedPost ? `${selectedPost.postTitle} 리뷰 작성` : '리뷰 작성'}
            </h2>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-3 font-medium">평점</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setSelectedRating(rating)}
                    className={`p-3 rounded-full transition-all duration-200 ${
                      selectedRating === rating
                        ? 'bg-yellow-400 transform scale-110'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Star className={`w-8 h-8 ${
                      selectedRating === rating ? 'text-white' : 'text-gray-400'
                    }`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-3 font-medium">리뷰 내용</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="4"
                placeholder="리뷰 내용을 입력하세요..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedRating(null);
                  setReviewText('');
                  setSelectedPost(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                취소
              </button>
              <button
                onClick={handleReviewSubmit}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                작성하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingManagement; 