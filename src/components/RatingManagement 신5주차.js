import React, { useState } from 'react';
import { Star, Edit, Trash2 } from 'lucide-react';

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
const StarRating = ({ rating, onRatingChange }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          className="focus:outline-none"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
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

// 리뷰 수정 모달 컴포넌트
const EditReviewModal = ({ isOpen, onClose, transaction, onSubmit }) => {
  const [comment, setComment] = useState(transaction?.comment || '');
  const [rating, setRating] = useState(transaction?.rating || 0);

  const handleSubmit = () => {
    onSubmit(transaction.id, { rating, comment });
    onClose();
  };

  if (!transaction) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="리뷰 수정">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">거래 만족도</label>
          <StarRating
            rating={rating}
            onRatingChange={setRating}
          />
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
            수정 완료
          </button>
        </div>
      </div>
    </Modal>
  );
};

// 거래 아이템 컴포넌트
const TransactionItem = ({ transaction, onRate, onEdit, onDelete }) => {
  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">{transaction.productName}</h3>
          <p className="text-sm text-gray-500">
            거래일: {transaction.date}
          </p>
          <p className="text-sm text-gray-500">
            거래자: {transaction.partnerName}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(transaction)}
            className="p-2 text-gray-400 hover:text-blue-500 rounded-full"
            title="리뷰 수정"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="p-2 text-gray-400 hover:text-red-500 rounded-full"
            title="리뷰 삭제"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium mb-2">거래 만족도 평가</p>
            <StarRating
              rating={transaction.rating}
              onRatingChange={(rating) => onRate(transaction.id, rating)}
            />
            {transaction.comment && (
              <div className="mt-2 text-sm text-gray-700">
                {transaction.comment}
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {transaction.rating ? '평가 완료' : '미평가'}
          </div>
        </div>
      </div>
    </div>
  );
};

// 메인 별점관리 컴포넌트
const RatingManagement = () => {
  // 거래 목록 상태
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      productName: '아이폰 14 Pro',
      date: '2024-01-15',
      partnerName: '홍길동',
      rating: 0,
      comment: '',
    },
    {
      id: 2,
      productName: '맥북 프로 16인치',
      date: '2024-01-14',
      partnerName: '김철수',
      rating: 4,
      comment: '제품 상태가 좋고 거래가 원활했습니다.',
    },
  ]);

  // 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // 거래 평가 처리
  const handleRate = (transactionId, rating) => {
    setTransactions(prev =>
      prev.map(t =>
        t.id === transactionId
          ? { ...t, rating }
          : t
      )
    );
  };

  // 리뷰 수정 처리
  const handleEditReview = (transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  // 리뷰 수정 제출 처리
  const handleEditSubmit = (transactionId, { rating, comment }) => {
    setTransactions(prev =>
      prev.map(t =>
        t.id === transactionId
          ? { ...t, rating, comment }
          : t
      )
    );
  };

  // 리뷰 삭제 처리
  const handleDeleteReview = (transactionId) => {
    setTransactions(prev =>
      prev.map(t =>
        t.id === transactionId
          ? { ...t, rating: 0, comment: '' }
          : t
      )
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">거래 평가 관리</h1>
        <p className="text-gray-600">
          최근 거래 내역과 평가를 확인하고 관리할 수 있습니다.
        </p>
      </div>

      <div className="space-y-4">
        {transactions.map(transaction => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            onRate={handleRate}
            onEdit={handleEditReview}
            onDelete={handleDeleteReview}
          />
        ))}
      </div>

      <EditReviewModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        transaction={selectedTransaction}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
};

export default RatingManagement;