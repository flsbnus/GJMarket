import React, { useState } from 'react';
import { Heart, Trash2 } from 'lucide-react';

// 상품 아이템 컴포넌트
const ProductItem = ({ product, isWished, onToggleWish, onDelete }) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg mb-4 bg-white shadow-sm">
      <div className="flex items-center space-x-4">
        <img
          src={product.image || "/api/placeholder/100/100"}
          alt={product.name}
          className="w-24 h-24 object-cover rounded"
        />
        <div>
          <h3 className="font-semibold text-lg">{product.name}</h3>
          <p className="text-gray-600">{product.price.toLocaleString()}원</p>
          <p className="text-sm text-gray-500">{product.location}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onToggleWish(product.id)}
          className={`p-2 rounded-full ${
            isWished ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-500'
          }`}
        >
          <Heart className={`w-6 h-6 ${isWished ? 'fill-current' : ''}`} />
        </button>
        {isWished && (
          <button
            onClick={() => onDelete(product.id)}
            className="p-2 text-gray-400 hover:text-gray-500 rounded-full"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

// 메인 찜상품관리 컴포넌트
const WishlistManagement = () => {
  // 샘플 상품 데이터
  const [products, setProducts] = useState([
    {
      id: 1,
      name: "아이폰 14 Pro",
      price: 1000000,
      location: "서울시 강남구",
      image: "/api/placeholder/100/100"
    },
    {
      id: 2,
      name: "맥북 프로 16인치",
      price: 2500000,
      location: "서울시 서초구",
      image: "/api/placeholder/100/100"
    },
    {
      id: 3,
      name: "애플워치 8",
      price: 500000,
      location: "서울시 송파구",
      image: "/api/placeholder/100/100"
    }
  ]);

  // 찜한 상품 ID 목록
  const [wishedItems, setWishedItems] = useState(new Set());

  // 찜하기/취소 토글
  const handleToggleWish = (productId) => {
    setWishedItems(prev => {
      const newWished = new Set(prev);
      if (newWished.has(productId)) {
        newWished.delete(productId);
      } else {
        newWished.add(productId);
      }
      return newWished;
    });
  };

  // 찜한 상품 삭제
  const handleDelete = (productId) => {
    setWishedItems(prev => {
      const newWished = new Set(prev);
      newWished.delete(productId);
      return newWished;
    });
  };

  // 보기 모드 (전체/찜한 상품만)
  const [showWishedOnly, setShowWishedOnly] = useState(false);

  const filteredProducts = showWishedOnly
    ? products.filter(product => wishedItems.has(product.id))
    : products;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">상품 목록</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowWishedOnly(false)}
            className={`px-4 py-2 rounded ${
              !showWishedOnly ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            전체 상품
          </button>
          <button
            onClick={() => setShowWishedOnly(true)}
            className={`px-4 py-2 rounded ${
              showWishedOnly ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            찜한 상품만
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredProducts.map(product => (
          <ProductItem
            key={product.id}
            product={product}
            isWished={wishedItems.has(product.id)}
            onToggleWish={handleToggleWish}
            onDelete={handleDelete}
          />
        ))}
        {showWishedOnly && filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            찜한 상품이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistManagement;
