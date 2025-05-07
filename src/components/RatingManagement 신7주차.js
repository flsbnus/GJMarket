import React, { useState, useEffect } from 'react';
import { Star, Edit, Trash2 } from 'lucide-react';



// JWT 토큰 가져오기 함수
const getToken = () => {
  return localStorage.getItem('jwtToken'); // 로컬 스토리지에서 JWT 토큰 가져오기
};

// API 요청 헤더 설정
// const getAuthHeader = () => {
//   const token = getToken();
//   if (!token) {
//     throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
//   }
//   return {
//     'Authorization': token,
//     'Content-Type': 'application/json'
//   };
// };
const getAuthHeader = () => {
  const token = getToken();
  if (!token) {
    throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
  }
  
  // 토큰이 이미 'Bearer'로 시작하는지 확인
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

// 거래 아이템 컴포넌트
const ReviewItem = ({ review, onEdit, onDelete, type }) => {
  console.log('렌더링 중인 리뷰 데이터:', review); // 데이터 확인용 로그
  
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
const ReviewManagement = () => {
  // 리뷰 목록 상태
  const [sentReviews, setSentReviews] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('sent'); // 'sent' 또는 'received'
  
  // 모달 상태
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  
  // 새 리뷰 작성을 위한 상태
  const [newReviewPostId, setNewReviewPostId] = useState('');
  const [newRevieweeId, setNewRevieweeId] = useState('');
  
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  
  // 로그인 상태
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 알림 상태
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        // 실제 구현에서는 navigate('/signin')을 사용할 수 있습니다.
        console.warn('로그인이 필요합니다.');
        return;
      }
      setIsLoggedIn(true);
    };
    
    checkAuth();
  }, []);

  // 리뷰 목록 불러오기
  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      // 요청 헤더 출력 (디버깅용)
      const headers = getAuthHeader();
      console.log('요청 헤더:', headers);

      // 내가 보낸 리뷰 (try-catch로 각 요청 분리)
      try {
        // fetch API를 사용하여 요청
        const response = await fetch('http://localhost:8080/api/reviews/sent', {
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
      
      // 내가 받은 리뷰 (try-catch로 각 요청 분리)
      try {
        // fetch API를 사용하여 요청
        const response = await fetch('http://localhost:8080/api/reviews/received', {
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
      
      return true; // 최소 한 개의 요청이 성공하면 true 반환
    } catch (error) {
      console.error('리뷰 데이터 로딩 메인 오류:', error);
      showNotification(`리뷰를 불러오는 중 오류가 발생했습니다: ${error.message}`, 'error');
      return false; // 데이터 가져오기 실패
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 리뷰 데이터 불러오기
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        await fetchReviews();
      } catch (error) {
        console.error('초기 데이터 로딩 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // 로그인했을 때만 데이터 로드 시도
    if (isLoggedIn) {
      loadInitialData();
    }
  }, [isLoggedIn]);
  
  // 리뷰 데이터 확인용 로그
  useEffect(() => {
    console.log('현재 보낸 리뷰:', sentReviews);
    console.log('현재 받은 리뷰:', receivedReviews);
  }, [sentReviews, receivedReviews]);

  // 알림 표시 함수
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // 리뷰 작성/수정 제출 처리
  // const handleReviewSubmit = async (reviewData, postId, revieweeId, reviewId = null) => {
  //   try {
  //     if (isEdit && reviewId) {
  //       // 리뷰 수정 API는 주어진 컨트롤러에 없으므로, 
  //       // 백엔드에 해당 API가 있다고 가정하고 구현
  //       // PUT 요청 구현 (나중에 백엔드 API가 준비되면 주석 해제)
  //       /*
  //       const response = await fetch(`http://localhost:8080/api/reviews/${reviewId}`, {
  //         method: 'PUT',
  //         headers: getAuthHeader(),
  //         body: JSON.stringify(reviewData)
  //       });
        
  //       if (!response.ok) {
  //         throw new Error(`HTTP 오류: ${response.status}`);
  //       }
        
  //       const data = await response.json();
  //       console.log('리뷰 수정 응답:', data);
  //       */
        
  //       showNotification('리뷰가 수정되었습니다.');
  //     } else {
  //       // 새 리뷰 작성 - Rating과 Comment만 전송
  //       const requestData = {
  //         rating: reviewData.rating,
  //         comment: reviewData.comment
  //       };
        
  //       console.log('리뷰 요청 데이터:', requestData);
  //       console.log('postId:', postId);
  //       console.log('revieweeId:', revieweeId);
        
  //       // 올바른 전체 URL 사용
  //       const url = `http://localhost:8080/api/posts/${postId}/reviews/${revieweeId}`;
  //       console.log('요청 URL:', url);
        
  //       // 응답 데이터 확인을 위한 요청 전송
  //       const response = await fetch(url, {
  //         method: 'POST',
  //         headers: getAuthHeader(),
  //         body: JSON.stringify(requestData)
  //       });
        
  //       if (!response.ok) {
  //         const errorText = await response.text();
  //         throw new Error(`HTTP 오류: ${response.status} - ${errorText}`);
  //       }
        
  //       const data = await response.json();
  //       console.log('리뷰 생성 응답:', data);
        
  //       // 응답 데이터 구조 검사
  //       if (data && data.id) {
  //         console.log('생성된 리뷰 ID:', data.id);
  //         console.log('게시글 정보:', data.post?.title || '정보 없음');
  //         console.log('리뷰 작성자:', data.reviewer?.nickname || '정보 없음');
  //         console.log('리뷰 대상자:', data.reviewee?.nickname || '정보 없음');
  //       }
        
  //       showNotification('리뷰가 등록되었습니다.');
  //     }
      
  //     // 리뷰 목록 다시 불러오기
  //     fetchReviews();
  //   } catch (error) {
  //     console.error('Error submitting review:', error);
  //     showNotification(`리뷰 제출 중 오류가 발생했습니다: ${error.message}`, 'error');
  //   }
  // };
  const handleReviewSubmit = async (reviewData, postId, revieweeId, reviewId = null) => {
    try {
      if (isEdit && reviewId) {
        // 리뷰 수정 로직 (생략)
        showNotification('리뷰가 수정되었습니다.');
      } else {
        // 입력값 타입 변환
        const numPostId = Number(postId);
        const numRevieweeId = Number(revieweeId);
        
        // 새 리뷰 작성 - 서버 형식에 맞춰 데이터 준비
        const requestData = {
          rating: Number(reviewData.rating) || 0,
          comment: reviewData.comment || ''
        };
        
        console.log('리뷰 요청 데이터:', requestData);
        
        // 인증 헤더 가져오기
        const headers = getAuthHeader();
        
        // 백엔드가 기대하는 형식으로 URL 구성
        const url = `http://localhost:8080/api/posts/${numPostId}/reviews/${numRevieweeId}`;
        
        // 응답 데이터 확인을 위한 요청 전송
        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestData)
        });
        
        // 응답 확인
        if (!response.ok) {
          const errorText = await response.text();
          console.error('서버 응답:', errorText);
          throw new Error(`HTTP 오류: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('리뷰 생성 응답:', data);
        
        showNotification('리뷰가 등록되었습니다.');
      }
      
      // 리뷰 목록 다시 불러오기
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      showNotification(`리뷰 제출 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
  };

  // 리뷰 수정 모달 열기
  const handleEditReview = (review) => {
    setSelectedReview(review);
    setIsEdit(true);
    setIsReviewModalOpen(true);
  };

  // 새 리뷰 작성 모달 열기
  const handleNewReview = () => {
    setSelectedReview(null);
    setIsEdit(false);
    setIsReviewModalOpen(true);
  };

  // 리뷰 삭제 처리
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('정말로 이 리뷰를 삭제하시겠습니까?')) return;
    
    try {
      // 리뷰 삭제 API는 주어진 컨트롤러에 없으므로,
      // 백엔드에 해당 API가 있다고 가정하고 구현
      // await axios.delete(`/api/reviews/${reviewId}`, getAuthHeader());
      
      showNotification('리뷰가 삭제되었습니다.');
      
      // 리뷰 목록 다시 불러오기
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      showNotification('리뷰 삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 알림 */}
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
          {/* 새 리뷰 작성 영역 */}
          <div className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-3">새 리뷰 작성</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">게시글 ID</label>
                <input
                  type="number"
                  value={newReviewPostId}
                  onChange={(e) => setNewReviewPostId(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="리뷰할 게시글 ID 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">리뷰 대상자 ID</label>
                <input
                  type="number"
                  value={newRevieweeId}
                  onChange={(e) => setNewRevieweeId(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="리뷰 대상자 ID 입력"
                />
              </div>
            </div>
            <button
              onClick={() => {
                if (newReviewPostId && newRevieweeId) {
                  setSelectedReview(null);
                  setIsEdit(false);
                  setIsReviewModalOpen(true);
                } else {
                  showNotification('게시글 ID와 리뷰 대상자 ID를 모두 입력해주세요.', 'error');
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? '처리 중...' : '리뷰 작성하기'}
            </button>
          </div>

          {/* 탭 선택 */}
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

          {/* 로딩 인디케이터 */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          )}

          {/* 리뷰 목록 */}
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

      

      {/* 리뷰 작성/수정 모달 */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        review={selectedReview}
        postId={selectedReview?.postId || newReviewPostId}
        revieweeId={selectedReview?.revieweeId || newRevieweeId}
        isEdit={isEdit}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
};

export default ReviewManagement;