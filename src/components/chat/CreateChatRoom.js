import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Search, ChevronRight } from 'lucide-react';

const CreateChatRoom = () => {
  const navigate = useNavigate();
  const { postId } = useParams(); // URL에서 postId를 가져옵니다
  
  const [postInfo, setPostInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  
  const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8080';

  // 특정 게시물 정보 가져오기 (URL에 postId가 있는 경우)
  useEffect(() => {
    const fetchPostInfo = async () => {
      if (!postId) {
        // postId가 없으면 게시물 정보를 가져올 필요 없음
        setLoading(false);
        return;
      }
      
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
          navigate('/signin');
          return;
        }
        
        setLoading(true);
        const response = await fetch(`${SERVER_URL}/api/posts/${postId}`, {
          method: 'GET',
          headers: {
            'Authorization': token,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('게시물 정보를 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        console.log('게시물 상세 정보:', data);
        setPostInfo(data);
        
        // 현재 사용자가 게시물 작성자인지 확인
        const currentUserId = localStorage.getItem('userId');
        if (data.user && data.user.id && data.user.id.toString() === currentUserId) {
          setError('자신의 게시물에는 채팅을 시작할 수 없습니다.');
        }
      } catch (error) {
        console.error('게시물 정보 로딩 오류:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPostInfo();
  }, [postId, navigate]);

  // 이미 존재하는 채팅방 확인 (URL에 postId가 있는 경우)
  useEffect(() => {
    const checkExistingChatRoom = async () => {
      if (!postId) return;
      
      try {
        const token = localStorage.getItem('jwtToken');
        
        const response = await fetch(`${SERVER_URL}/api/posts/${postId}/chatroom`, {
          method: 'GET',
          headers: {
            'Authorization': token,
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // 이미 채팅방이 존재하면 해당 채팅방으로 리디렉션
          if (data && data.id) {
            navigate(`/chatroom/${data.id}`);
          }
        }
      } catch (error) {
        console.error('채팅방 확인 오류:', error);
      }
    };
    
    checkExistingChatRoom();
  }, [postId, navigate]);

  // 모든 게시물 목록 가져오기 (postId가 없는 경우, 게시물 선택 화면을 위함)
  useEffect(() => {
    const fetchPosts = async () => {
      if (postId) return; // 이미 특정 게시물이 선택된 경우 목록을 가져올 필요 없음
      
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
          navigate('/signin');
          return;
        }
        
        setLoadingPosts(true);
        const response = await fetch(`${SERVER_URL}/api/posts`, {
          method: 'GET',
          headers: {
            'Authorization': token,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('게시물 목록을 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        console.log('서버 응답 데이터:', data);
        
        // 페이지네이션 응답 구조에서 content 배열 추출
        const postsArray = data.content || [];
        
        // 현재 사용자의 게시물 제외
        const currentUserId = localStorage.getItem('userId');
        const filteredData = postsArray.filter(post => 
          post.user && post.user.id && post.user.id.toString() !== currentUserId
        );
        
        setPosts(filteredData);
        setFilteredPosts(filteredData);
        setLoading(false);
      } catch (error) {
        console.error('게시물 목록 로딩 오류:', error);
        setError(error.message);
        setLoading(false);
      } finally {
        setLoadingPosts(false);
      }
    };
    
    fetchPosts();
  }, [postId, navigate]);

  // 검색어에 따라 게시물 필터링
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (post.user && post.user.nickname && post.user.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPosts(filtered);
    }
  }, [searchTerm, posts]);

  // 채팅방 생성 함수
  const handleCreateChatRoom = async (selectedPostId) => {
    const postIdToUse = selectedPostId || postId;
    
    if (!postIdToUse) {
      setError('게시물 정보가 없습니다.');
      return;
    }
    
    try {
      setCreating(true);
      const token = localStorage.getItem('jwtToken');
      
      const response = await fetch(`${SERVER_URL}/api/post/${postIdToUse}/chatroom`, {
        method: 'POST',
        headers: {
          'Authorization': token
        }
      });
      
      if (!response.ok) {
        throw new Error('채팅방 생성에 실패했습니다.');
      }
      
      const data = await response.json();
      
      // 생성된 채팅방으로 이동
      navigate(`/chatroom/${data.id}`);
    } catch (error) {
      console.error('채팅방 생성 오류:', error);
      setError(error.message);
    } finally {
      setCreating(false);
    }
  };
  
  // 프로필 이미지 URL 생성 함수
  const getProfileImageUrl = (relativePath) => {
    if (!relativePath) return '/default-profile.png';
    if (relativePath.startsWith('http')) return relativePath;
    return `${SERVER_URL}/images${relativePath}`;
  };

  // 가격 포맷팅 함수
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '';
    return typeof price === 'number' ? price.toLocaleString() : price;
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-8 p-4 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
        <p className="mt-2 text-gray-600">정보를 불러오는 중...</p>
      </div>
    );
  }

  // 특정 게시물이 선택된 경우 (URL에 postId가 있는 경우)
  if (postId && postInfo) {
    return (
      <div className="max-w-md mx-auto mt-4 p-4">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="mr-2 p-1"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold">채팅 시작하기</h2>
        </div>
        
        {error && (
          <div className="bg-red-100 p-3 rounded-lg text-red-700 mb-4">
            <p>{error}</p>
            <button 
              onClick={() => navigate(-1)}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              돌아가기
            </button>
          </div>
        )}
        
        {postInfo && !error && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* 게시물 정보 */}
            <div className="p-4 border-b">
              <div className="flex items-center mb-2">
                <img 
                  src={getProfileImageUrl(postInfo.user?.profileImageUrl)} 
                  alt={postInfo.user?.nickname} 
                  className="w-10 h-10 rounded-full object-cover mr-3"
                  onError={(e) => { e.target.src = '/default-profile.png' }}
                />
                <div>
                  <p className="font-medium">{postInfo.user?.nickname}</p>
                  <p className="text-xs text-gray-500">{postInfo.user?.location || '위치 정보 없음'}</p>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-1">{postInfo.title}</h3>
              
              {postInfo.price !== undefined && (
                <p className="text-blue-600 font-bold mb-2">{formatPrice(postInfo.price)}원</p>
              )}
              
              {postInfo.content && (
                <p className="text-gray-700 text-sm mb-3 line-clamp-2">{postInfo.content}</p>
              )}
              
              {postInfo.images && postInfo.images.length > 0 && (
                <div className="w-full h-40 bg-gray-100 rounded overflow-hidden mb-3">
                  <img 
                    src={getProfileImageUrl(postInfo.images[0].imageUrl)} 
                    alt={postInfo.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = '/default-thumbnail.png' }}
                  />
                </div>
              )}
            </div>
            
            {/* 채팅 시작 버튼 */}
            <div className="p-4 bg-gray-50">
              <button 
                onClick={() => handleCreateChatRoom()}
                disabled={creating || error}
                className="w-full py-3 bg-blue-500 text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                ) : (
                  <>
                    <MessageCircle className="mr-2" size={20} />
                    <span>채팅 시작하기</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                {postInfo.user?.nickname}님에게 메시지를 보내 거래를 시작하세요.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 게시물 선택 화면 (URL에 postId가 없는 경우)
  return (
    <div className="max-w-md mx-auto mt-4 p-4">
      <div className="flex items-center mb-4">
        <button 
          onClick={() => navigate(-1)}
          className="mr-2 p-1"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold">채팅할 게시물 선택</h2>
      </div>
      
      {error && (
        <div className="bg-red-100 p-3 rounded-lg text-red-700 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* 게시물 검색 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="게시물 제목이나 내용으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
        />
      </div>
      
      {/* 게시물 목록 */}
      {loadingPosts ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-600">게시물 목록을 불러오는 중...</p>
        </div>
      ) : (
        <>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <MessageCircle size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">검색 결과가 없거나 채팅할 수 있는 게시물이 없습니다.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredPosts.map((post) => (
                <li 
                  key={post.id} 
                  className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleCreateChatRoom(post.id)}
                >
                  <div className="flex p-3">
                    {post.images && post.images.length > 0 ? (
                      <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden mr-3 flex-shrink-0">
                        <img 
                          src={getProfileImageUrl(post.images[0].imageUrl)} 
                          alt={post.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = '/default-thumbnail.png' }}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center mr-3 flex-shrink-0">
                        <MessageCircle className="text-gray-400" size={24} />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate">{post.user?.nickname || '판매자'}</p>
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                      <h3 className="font-medium text-lg truncate">{post.title}</h3>
                      {post.price !== undefined && (
                        <p className="text-blue-600 font-bold">{formatPrice(post.price)}원</p>
                      )}
                      {post.content && (
                        <p className="text-sm text-gray-700 truncate">{post.content}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default CreateChatRoom;