import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const PostsList = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 페이징 상태
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 로그인 상태 확인
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

  // 게시물 목록 불러오기
  useEffect(() => {
    const fetchPosts = async () => {
      if (!isLoggedIn) return;

      try {
        setIsLoading(true);
        const token = localStorage.getItem('jwtToken');
        
        const response = await fetch(`/api/posts?page=${page}&size=${size}`, {
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
        console.log('서버 응답 데이터:', data);
        
        // Spring의 Page 객체 구조 처리
        if (data.content && Array.isArray(data.content)) {
          setPosts(data.content);
          setTotalPages(data.totalPages || 0);
          setTotalElements(data.totalElements || 0);
        } else {
          // 응답 형식이 예상과 다른 경우
          console.warn('예상치 못한 응답 구조:', data);
          setPosts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('게시물 목록 조회 오류:', error);
        setError(error.message);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchPosts();
    }
  }, [isLoggedIn, page, size]);

  // 검색어 처리
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 페이지 변경 처리
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  // 게시물 생성 페이지로 이동
  const goToCreatePost = () => {
    navigate('/posts/create');
  };

  // 게시물 상세 페이지로 이동
  const goToPostDetail = (postId) => {
    navigate(`/posts/${postId}`);
  };

  // 검색 결과 필터링 (클라이언트 측 필터링)
  const filteredPosts = Array.isArray(posts) ? posts.filter(post => 
    post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // 가격 형식화 (1000 -> 1,000원)
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '가격 정보 없음';
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  // 로그인 상태가 아니면 로딩 표시 또는 빈 화면 반환
  if (!isLoggedIn) {
    return <div className="text-center py-10">인증 확인 중...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">게시물 목록</h1>
        <button
          onClick={goToCreatePost}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>글 작성</span>
        </button>
      </div>

      {/* 검색 바 */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="제목 또는 내용으로 검색"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full p-3 pl-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="loader">로딩 중...</div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg text-center">
          {error}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          {searchTerm ? '검색 결과가 없습니다.' : '등록된 게시물이 없습니다.'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map(post => (
              <div 
                key={post.id}
                onClick={() => goToPostDetail(post.id)}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition duration-200 cursor-pointer"
              >
                {/* {post.imageUrl ? (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={post.imageUrl} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                    이미지 없음
                  </div>
                )} */}
                {post.images && post.images.length > 0 ? (
  <div className="h-48 overflow-hidden">
    <img
      src={`/images/${post.images[0].imageUrl}`}
      alt={post.title}
      className="w-full h-full object-cover transition-transform hover:scale-105"
    />
  </div>
) : (
  <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-500">
    이미지 없음
  </div>
)}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 truncate">{post.title}</h3>
                  <p className="text-blue-600 font-medium mb-2">{formatPrice(post.price)}</p>
                  <p className="text-gray-600 text-sm line-clamp-2 h-10">{post.content}</p>
                  <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
                  <span>{post.user?.nickname || '익명'}</span>
                    <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '날짜 정보 없음'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 컨트롤 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-8 space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                className={`p-2 rounded-full ${
                  page === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex space-x-1">
                {[...Array(totalPages).keys()].map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-full ${
                      pageNum === page
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages - 1}
                className={`p-2 rounded-full ${
                  page === totalPages - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="text-center text-sm text-gray-500 mt-4">
            총 {totalElements}개의 게시물 중 {page * size + 1}-{Math.min((page + 1) * size, totalElements)}개 표시
          </div>
        </>
      )}
    </div>
  );
};

export default PostsList;