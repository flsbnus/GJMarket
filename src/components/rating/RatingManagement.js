import React, { useState, useEffect } from 'react';
import { Star, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL } from '../../config';

// JWT 토큰 가져오기 함수
const getToken = () => {
  return localStorage.getItem('jwtToken');
};

// API 요청 헤더 설정
const getAuthHeader = () => {
  const token = getToken();
  if (!token) {
    throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
  }
  
  const tokenValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  
  return {
    'Authorization': tokenValue,
    'Content-Type': 'application/json'
  };
};

// 커스텀 모달 컴포넌트
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-md w-full m-4 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// 별점 컴포넌트
const StarRating = ({ rating, onRatingChange, readOnly = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          className="focus:outline-none"
          onClick={() => !readOnly && onRatingChange(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          disabled={readOnly}
        >
          <Star
            className={`w-8 h-8 ${
              star <= (hover || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

// 리뷰 작성/수정 모달 컴포넌트
const ReviewModal = ({ isOpen, onClose, review, postId, revieweeId, isEdit, onSubmit }) => {
  const [comment, setComment] = useState(review?.comment || '');
  const [rating, setRating] = useState(review?.rating || 0);

  useEffect(() => {
    if (review) {
      setComment(review.comment || '');
      setRating(review.rating || 0);
    } else {
      setComment('');
      setRating(0);
    }
  }, [review]);

  const handleSubmit = () => {
    const reviewData = {
      rating: Number(rating),
      comment: comment.trim()
    };
    
    onSubmit(reviewData, postId, revieweeId, review?.id);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "리뷰 수정" : "리뷰 작성"}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">거래 만족도</label>
          <StarRating
            rating={rating}
            onRatingChange={setRating}
          />
          <p className="text-xs text-gray-500 mt-1">별을 클릭하여 평가해주세요 (1-5점)</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">리뷰 내용</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2 border rounded h-32 resize-none"
            placeholder="거래에 대한 상세 후기를 작성해주세요."
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isEdit ? "수정 완료" : "등록 완료"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// 리뷰 아이템 컴포넌트
const ReviewItem = ({ review, onEdit, onDelete, type }) => {
  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">
            게시글: {review.post?.title || '게시글 정보 없음'}
          </h3>
          <p className="text-sm text-gray-500">
            가격: {review.post?.price?.toLocaleString() || '가격 정보 없음'}원
          </p>
          <p className="text-sm text-gray-500">
            {type === 'sent' ? 
              `받는 사람: ${review.reviewee?.nickname || '정보 없음'}` : 
              `보낸 사람: ${review.reviewer?.nickname || '정보 없음'}`}
          </p>
        </div>
        {type === 'sent' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(review)}
              className="p-2 text-gray-400 hover:text-blue-500 rounded-full"
              title="리뷰 수정"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(review.id)}
              className="p-2 text-gray-400 hover:text-red-500 rounded-full"
              title="리뷰 삭제"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium mb-2">
              거래 만족도 평가: <span className="font-bold">{review.rating}점</span>
            </p>
            <div className="flex mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            {review.comment && (
              <div className="mt-2 text-sm text-gray-700">
                <p className="font-medium mb-1">리뷰 코멘트:</p>
                <p className="bg-gray-50 p-2 rounded">{review.comment}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 메인 리뷰관리 컴포넌트
const RatingManagement = () => {
  const navigate = useNavigate();
  const [sentReviews, setSentReviews] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('sent');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [newReviewPostId, setNewReviewPostId] = useState('');
  const [newRevieweeId, setNewRevieweeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [recentChats, setRecentChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        navigate('/signin');
        return;
      }
      setIsLoggedIn(true);
    };
    
    checkAuth();
  }, [navigate]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeader();
      console.log('요청 헤더:', headers);

      try {
        const response = await fetch(`${SERVER_URL}/api/reviews/sent`, {
          method: 'GET',
          headers: getAuthHeader()
        });
        
        if (!response.ok) {
          throw new Error(`HTTP 오류: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('보낸 리뷰 데이터:', data);
        
        const sentData = Array.isArray(data) ? data : [];
        setSentReviews(sentData);
      } catch (error) {
        console.error('보낸 리뷰 로딩 오류:', error);
        setSentReviews([]);
      }
      
      try {
        const response = await fetch(`${SERVER_URL}/api/reviews/received`, {
          method: 'GET',
          headers: getAuthHeader()
        });
        
        if (!response.ok) {
          throw new Error(`HTTP 오류: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('받은 리뷰 데이터:', data);
        
        const receivedData = Array.isArray(data) ? data : [];
        setReceivedReviews(receivedData);
      } catch (error) {
        console.error('받은 리뷰 로딩 오류:', error);
        setReceivedReviews([]);
      }
      
      return true;
    } catch (error) {
      console.error('리뷰 데이터 로딩 메인 오류:', error);
      showNotification(`리뷰를 불러오는 중 오류가 발생했습니다: ${error.message}`, 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 최근 채팅방 가져오기
  const fetchRecentChats = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${SERVER_URL}/api/users/${userId}/chatrooms`, {
        method: 'GET',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP 오류: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('채팅방 데이터:', data);

      // 각 채팅방의 게시글 정보 가져오기
      const chatsWithPostInfo = await Promise.all(
        data.map(async (chat) => {
          try {
            const postResponse = await fetch(`${SERVER_URL}/api/post/${chat.postId}`, {
              method: 'GET',
              headers: getAuthHeader()
            });
            
            if (postResponse.ok) {
              const postData = await postResponse.json();
              // 현재 사용자가 구매자인지 확인
              const isBuyer = chat.buyer?.id === Number(userId);
              // 리뷰 대상자 ID 설정 (구매자는 판매자에게, 판매자는 구매자에게)
              const revieweeId = isBuyer ? chat.seller?.id : chat.buyer?.id;
              
              console.log('채팅방 정보:', {
                chatId: chat.id,
                postId: chat.postId,
                isBuyer,
                revieweeId,
                currentUserId: userId,
                buyerId: chat.buyer?.id,
                sellerId: chat.seller?.id
              });
              
              return {
                ...chat,
                post: postData,
                isBuyer,
                revieweeId,
                buyerId: chat.buyer?.id,
                sellerId: chat.seller?.id
              };
            }
            return chat;
          } catch (error) {
            console.error(`게시글 ${chat.postId} 정보 로딩 오류:`, error);
            return chat;
          }
        })
      );

      console.log('처리된 채팅방 데이터:', chatsWithPostInfo);
      setRecentChats(chatsWithPostInfo);
    } catch (error) {
      console.error('채팅방 로딩 오류:', error);
      showNotification('채팅방을 불러오는데 실패했습니다.', 'error');
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchReviews();
      fetchRecentChats();
    }
  }, [isLoggedIn]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleReviewSubmit = async (reviewData, postId, revieweeId, reviewId = null) => {
    try {
      console.log('리뷰 제출 데이터:', { reviewData, postId, revieweeId, reviewId });
      
      if (!postId || !revieweeId) {
        console.error('필수 ID 누락:', { postId, revieweeId });
        throw new Error('게시글 ID와 리뷰 대상자 ID가 필요합니다.');
      }
      
      const numPostId = Number(postId);
      const numRevieweeId = Number(revieweeId);
      const numRating = Number(reviewData.rating) || 0;
      const comment = reviewData.comment || '';
      
      if (isNaN(numPostId) || isNaN(numRevieweeId)) {
        console.error('유효하지 않은 ID:', { postId, revieweeId });
        throw new Error('게시글 ID 또는 사용자 ID가 유효하지 않습니다.');
      }
      
      const existingReview = sentReviews.find(review => 
        review.post && review.post.id === numPostId && 
        review.reviewee && review.reviewee.id === numRevieweeId
      );
      
      let url, method;
      
      if (existingReview || reviewId) {
        const targetReviewId = reviewId || existingReview.id;
        url = `${SERVER_URL}/api/reviews/${targetReviewId}?rating=${numRating}&comment=${encodeURIComponent(comment)}`;
        method = 'PUT';
        console.log('리뷰 수정 URL:', url);
      } else {
        url = `${SERVER_URL}/api/posts/${numPostId}/reviews/${numRevieweeId}?rating=${numRating}&comment=${encodeURIComponent(comment)}`;
        method = 'POST';
        console.log('리뷰 생성 URL:', url);
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': getAuthHeader().Authorization,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('서버 오류 응답:', errorText);
        throw new Error(`HTTP 오류: ${response.status} - ${errorText}`);
      }
      
      showNotification(existingReview || reviewId ? '리뷰가 수정되었습니다.' : '리뷰가 등록되었습니다.');
      fetchReviews();
    } catch (error) {
      console.error('리뷰 제출 오류:', error);
      showNotification(`리뷰 제출 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
  };

  const handleEditReview = (review) => {
    setSelectedReview(review);
    setIsEdit(true);
    setIsReviewModalOpen(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('정말로 이 리뷰를 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`${SERVER_URL}/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`리뷰 삭제 실패: ${response.status} ${errorText}`);
      }
      
      showNotification('리뷰가 삭제되었습니다.');
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      showNotification(`리뷰 삭제 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {notification.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white z-50`}>
          {notification.message}
        </div>
      )}
    
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">리뷰 관리</h1>
        <p className="text-gray-600">
          내가 작성한 리뷰와 받은 리뷰를 확인하고 관리할 수 있습니다.
        </p>
      </div>
      
      {!isLoggedIn ? (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-lg text-yellow-700 mb-4">로그인이 필요한 서비스입니다</p>
          <p className="text-gray-600">리뷰 관리를 위해 먼저 로그인해주세요.</p>
        </div>
      ) : (
        <>
          <div className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-3">새 리뷰 작성</h2>
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">채팅방 목록</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {recentChats.length > 0 ? (
                  recentChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedChat?.id === chat.id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        console.log('선택된 채팅방:', chat);
                        setSelectedChat(chat);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{chat.post?.title || '제목 없음'}</h4>
                          <p className="text-sm text-gray-500">
                            {chat.isBuyer ? '판매자' : '구매자'}에게 리뷰 가능
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(chat.lastMessageTime || chat.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{chat.post?.price?.toLocaleString() || 0}원</p>
                          {sentReviews.some(review => 
                            review.post?.id === chat.postId && 
                            review.reviewee?.id === chat.revieweeId
                          ) ? (
                            <span className="text-xs text-gray-500">리뷰 완료</span>
                          ) : (
                            <span className="text-xs text-blue-500">리뷰 가능</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">채팅방이 없습니다.</p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                if (selectedChat) {
                  console.log('리뷰 작성 시도:', selectedChat);
                  setSelectedReview(null);
                  setIsEdit(false);
                  setIsReviewModalOpen(true);
                } else {
                  showNotification('리뷰할 채팅방을 선택해주세요.', 'error');
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={isLoading || !selectedChat}
            >
              {isLoading ? '처리 중...' : '리뷰 작성하기'}
            </button>
          </div>

          <div className="flex border-b mb-6">
            <button
              className={`px-4 py-2 ${activeTab === 'sent' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('sent')}
            >
              내가 보낸 리뷰
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'received' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('received')}
            >
              내가 받은 리뷰
            </button>
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          )}

          {!isLoading && (
            <div className="space-y-4">
              {activeTab === 'sent' ? (
                sentReviews.length > 0 ? (
                  sentReviews.map(review => (
                    <ReviewItem
                      key={review.id}
                      review={review}
                      type="sent"
                      onEdit={handleEditReview}
                      onDelete={handleDeleteReview}
                    />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">작성한 리뷰가 없습니다.</p>
                )
              ) : (
                receivedReviews.length > 0 ? (
                  receivedReviews.map(review => (
                    <ReviewItem
                      key={review.id}
                      review={review}
                      type="received"
                    />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">받은 리뷰가 없습니다.</p>
                )
              )}
            </div>
          )}
        </>
      )}

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedChat(null);
        }}
        review={selectedReview}
        postId={selectedChat?.post?.id}
        revieweeId={selectedChat?.revieweeId}
        isEdit={isEdit}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
};

export default RatingManagement; 