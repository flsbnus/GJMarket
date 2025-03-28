import React, { useState } from 'react';
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Search, Calendar, MapPin } from 'lucide-react';

// 거래 내역 아이템 컴포넌트
const TransactionItem = ({ transaction }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-white shadow-sm mb-4 overflow-hidden">
      {/* 기본 정보 */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={transaction.image || "/api/placeholder/80/80"}
              alt={transaction.productName}
              className="w-20 h-20 object-cover rounded"
            />
            <div>
              <h3 className="font-semibold">{transaction.productName}</h3>
              <p className="text-lg font-medium text-blue-600">
                {transaction.price.toLocaleString()}원
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1" />
                {transaction.date}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-sm ${
              transaction.status === '거래완료' 
                ? 'bg-green-100 text-green-800'
                : transaction.status === '거래중' 
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {transaction.status}
            </span>
          </div>
        </div>
      </div>

      {/* 상세 정보 */}
      {isExpanded && (
        <div className="border-t p-4 bg-gray-50">
          <div className="space-y-3">
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-500 mb-1">거래 정보</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {transaction.location}
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">거래 방식:</span> {transaction.method}
                  </p>
                  {transaction.trackingNumber && (
                    <p className="text-sm">
                      <span className="font-medium">운송장 번호:</span> {transaction.trackingNumber}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-500 mb-1">거래자 정보</h4>
                <p className="text-sm">
                  <span className="font-medium">거래자:</span> {transaction.partnerName}
                </p>
                <p className="text-sm">
                  <span className="font-medium">연락처:</span> {transaction.partnerContact}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 거래 목록 컴포넌트
const TransactionList = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // 검색 및 정렬된 거래 목록
  const filteredAndSortedTransactions = transactions
    .filter(transaction => 
      transaction.productName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'date') {
        return order * (new Date(a.date) - new Date(b.date));
      }
      if (sortBy === 'price') {
        return order * (a.price - b.price);
      }
      return 0;
    });

  return (
    <div className="space-y-4">
      {/* 검색 및 정렬 */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="상품명 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">날짜순</option>
            <option value="price">가격순</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            {sortOrder === 'asc' ? (
              <ArrowUpWideNarrow className="w-5 h-5" />
            ) : (
              <ArrowDownWideNarrow className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* 거래 목록 */}
      {filteredAndSortedTransactions.length > 0 ? (
        filteredAndSortedTransactions.map(transaction => (
          <TransactionItem 
            key={transaction.id} 
            transaction={transaction} 
          />
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          거래 내역이 없습니다.
        </div>
      )}
    </div>
  );
};

// 메인 거래내역관리 컴포넌트
const TransactionManagement = () => {
  const [activeTab, setActiveTab] = useState('purchase');

  // 샘플 데이터
  const purchaseHistory = [
    {
      id: 1,
      productName: '아이폰 14 Pro',
      price: 1000000,
      date: '2024-01-15',
      status: '거래완료',
      location: '서울시 강남구',
      method: '직거래',
      partnerName: '홍길동',
      partnerContact: '010-1234-5678',
      image: '/api/placeholder/80/80'
    },
    {
      id: 2,
      productName: '맥북 프로 16인치',
      price: 2500000,
      date: '2024-01-14',
      status: '거래중',
      location: '서울시 서초구',
      method: '택배거래',
      trackingNumber: '1234567890',
      partnerName: '김철수',
      partnerContact: '010-9876-5432',
      image: '/api/placeholder/80/80'
    }
  ];

  const salesHistory = [
    {
      id: 3,
      productName: '애플워치 8',
      price: 500000,
      date: '2024-01-13',
      status: '거래완료',
      location: '서울시 송파구',
      method: '직거래',
      partnerName: '이영희',
      partnerContact: '010-5555-5555',
      image: '/api/placeholder/80/80'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">거래내역 관리</h1>

      {/* 탭 버튼 */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab('purchase')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'purchase'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          구매내역
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'sales'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          판매내역
        </button>
      </div>

      {/* 거래 목록 */}
      {activeTab === 'purchase' ? (
        <TransactionList transactions={purchaseHistory} />
      ) : (
        <TransactionList transactions={salesHistory} />
      )}
    </div>
  );
};

export default TransactionManagement;
