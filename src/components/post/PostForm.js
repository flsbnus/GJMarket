import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, X } from 'lucide-react';

const PostForm = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    content: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);

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

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'image' && files && files[0]) {
      // 이미지 파일 처리
      setFormData({
        ...formData,
        image: files[0]
      });
      
      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(files[0]);
    } else if (name === 'price') {
      // 가격은 숫자만 입력 가능하도록
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData({
        ...formData,
        [name]: numericValue
      });
    } else {
      // 일반 텍스트 필드 처리
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const clearImagePreview = () => {
    setImagePreview(null);
    setFormData({
      ...formData,
      image: null
    });
    // file input 초기화를 위한 참조 생성 및 값 재설정
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!isLoggedIn) {
//       setMessage('로그인이 필요합니다.');
//       navigate('/signin');
//       return;
//     }

//     // 필수 필드 검증
//     if (!formData.title.trim()) {
//       setMessage('제목을 입력해주세요.');
//       return;
//     }
//     if (!formData.price) {
//       setMessage('가격을 입력해주세요.');
//       return;
//     }
//     if (!formData.content.trim()) {
//       setMessage('내용을 입력해주세요.');
//       return;
//     }

//     setIsSubmitting(true);
//     setMessage('');

//     try {
//       const token = localStorage.getItem('jwtToken');
      
//       // FormData 객체 생성
//       const apiFormData = new FormData();
//       apiFormData.append('title', formData.title);
//       apiFormData.append('price', formData.price);
//       apiFormData.append('content', formData.content);
      
//       if (formData.image) {
//         apiFormData.append('image', formData.image);
//       }

//       // Spring 컨트롤러에 맞는 엔드포인트로 요청
//       const response = await fetch('/api/post', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}` // Bearer 접두사 추가
//         },
//         body: apiFormData
//       });

//       if (response.ok) {
//         const responseData = await response.json();
//         console.log('게시물 등록 성공:', responseData);
        
//         setMessage('게시물이 성공적으로 등록되었습니다.');
        
//         // 게시물 목록 페이지로 리다이렉트
//         setTimeout(() => {
//           navigate('/posts');
//         }, 1500);
//       } else {
//         const errorData = await response.text();
//         console.error('게시물 등록 실패 응답:', errorData);
//         setMessage(`게시물 등록 실패: ${errorData}`);
//       }
//     } catch (error) {
//       console.error('게시물 등록 오류:', error);
//       setMessage(`오류가 발생했습니다: ${error.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

// const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!isLoggedIn) {
//       setMessage('로그인이 필요합니다.');
//       navigate('/signin');
//       return;
//     }

//     // 토큰 값 확인 - 여기에 2번 코드 추가
//   const token = localStorage.getItem('jwtToken');
//   console.log('토큰 값:', token); // 토큰 형식 확인
  
  
//     // 필수 필드 검증
//     if (!formData.title.trim()) {
//       setMessage('제목을 입력해주세요.');
//       return;
//     }
//     if (!formData.content.trim()) {
//       setMessage('내용을 입력해주세요.');
//       return;
//     }
  
//     setIsSubmitting(true);
//     setMessage('');
  
//     try {
//       const token = localStorage.getItem('jwtToken');
      
//       // PostDTO 구조에 맞게 JSON 데이터 구성
//       const postData = {
//         title: formData.title,
//         content: formData.content,
//         price: formData.price ? parseInt(formData.price, 10) : 0
//         // userId는 서버에서 토큰으로 추출하므로 보내지 않음
//         // status, createdAt, updatedAt, viewCount, wishlistCount는 서버에서 설정
//       };
  
//       console.log('전송할 데이터:', postData);
      
//       const response = await fetch('/api/post', {
//         method: 'POST',
//         headers: {
//           'Authorization': `${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(postData)
//       });
  
//       if (response.ok) {
//         const responseData = await response.json();
//         console.log('게시물 등록 성공:', responseData);
        
//         setMessage('게시물이 성공적으로 등록되었습니다.');
        
//         // 게시물 목록 페이지로 리다이렉트
//         setTimeout(() => {
//           navigate('/posts');
//         }, 1500);
//       } else {
//         const errorText = await response.text();
//         console.error('게시물 등록 실패 응답:', errorText);
//         setMessage(`게시물 등록 실패: ${errorText}`);
//       }
//     } catch (error) {
//       console.error('게시물 등록 오류:', error);
//       setMessage(`오류가 발생했습니다: ${error.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

// const handleSubmit = async (e) => {
//   e.preventDefault();
  
//   if (!isLoggedIn) {
//     setMessage('로그인이 필요합니다.');
//     navigate('/signin');
//     return;
//   }
  
//   // 토큰 값 확인
//   const token = localStorage.getItem('jwtToken');
//   console.log('토큰 값:', token);
  
//   if (!token) {
//     setMessage('인증 토큰이 없습니다. 다시 로그인해주세요.');
//     navigate('/signin');
//     return;
//   }

//   // 필수 필드 검증
//   if (!formData.title.trim()) {
//     setMessage('제목을 입력해주세요.');
//     return;
//   }
//   if (!formData.content.trim()) {
//     setMessage('내용을 입력해주세요.');
//     return;
//   }

//   setIsSubmitting(true);
//   setMessage('');

//   try {
//     // FormData 객체 생성
//     const apiFormData = new FormData();
    
//     // PostDTO 필드 추가
//     apiFormData.append('title', formData.title);
//     apiFormData.append('content', formData.content);
//     apiFormData.append('price', formData.price || '0');
    
//     // PostImageDTO 필드 추가 (컨트롤러의 매개변수 이름에 맞게 조정 필요)
//     if (formData.image) {
//       // 컨트롤러에서 imageDTOs 리스트로 받으므로 배열 형태로 전송
//       apiFormData.append('imageDTOs[0].image', formData.image);
//     }

//     // JWT 토큰에서 Bearer 접두사 확인 및 조정
//     let authHeader;
//     if (token.includes('.')) {
//       // 일반적인 JWT 토큰 형식 (점 포함)
//       authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
//     } else {
//       // 비표준 형식이거나 이미 전체 헤더 값인 경우
//       authHeader = token;
//     }
    
//     const response = await fetch('/api/post', {
//       method: 'POST',
//       headers: {
//         'Authorization': authHeader
//         // FormData를 사용할 때는 Content-Type 헤더를 자동 설정됨
//       },
//       body: apiFormData
//     });

//     if (response.ok) {
//       try {
//         const responseData = await response.json();
//         console.log('게시물 등록 성공:', responseData);
//       } catch (e) {
//         console.log('응답이 JSON이 아닙니다');
//       }
      
//       setMessage('게시물이 성공적으로 등록되었습니다.');
      
//       // 게시물 목록 페이지로 리다이렉트
//       setTimeout(() => {
//         navigate('/posts');
//       }, 1500);
//     } else {
//       const errorText = await response.text();
//       console.error('게시물 등록 실패 응답:', errorText);
//       setMessage(`게시물 등록 실패: ${errorText}`);
//     }
//   } catch (error) {
//     console.error('게시물 등록 오류:', error);
//     setMessage(`오류가 발생했습니다: ${error.message}`);
//   } finally {
//     setIsSubmitting(false);
//   }
// };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!isLoggedIn) {
    setMessage('로그인이 필요합니다.');
    navigate('/signin');
    return;
  }
  
  // 토큰 값 확인
  const token = localStorage.getItem('jwtToken');
  console.log('토큰 값:', token);
  
  if (!token) {
    setMessage('인증 토큰이 없습니다. 다시 로그인해주세요.');
    navigate('/signin');
    return;
  }

  // 필수 필드 검증
  if (!formData.title.trim()) {
    setMessage('제목을 입력해주세요.');
    return;
  }
  if (!formData.content.trim()) {
    setMessage('내용을 입력해주세요.');
    return;
  }

  setIsSubmitting(true);
  setMessage('');

  try {
    // FormData 객체 생성
    const apiFormData = new FormData();
    
    // PostDTO 필드 추가
    apiFormData.append('title', formData.title);
    apiFormData.append('content', formData.content);
    apiFormData.append('price', formData.price || '0');
    
    // 파일 업로드를 위한 필드 추가
    if (formData.image) {
      // 중요: 서버 API와 맞는 필드명 사용
      // 서버 로그를 보고 정확한 필드명 확인 필요
      apiFormData.append('images', formData.image);
    }

    // JWT 토큰 설정
    let authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    const response = await fetch('/api/post', {
      method: 'POST',
      headers: {
        'Authorization': authHeader
      },
      body: apiFormData
    });

    if (response.ok) {
      try {
        const responseData = await response.json();
        console.log('게시물 등록 성공:', responseData);
      } catch (e) {
        console.log('응답이 JSON이 아닙니다');
      }
      
      setMessage('게시물이 성공적으로 등록되었습니다.');
      
      // 게시물 목록 페이지로 리다이렉트
      setTimeout(() => {
        navigate('/posts');
      }, 1500);
    } else {
      const errorText = await response.text();
      console.error('게시물 등록 실패 응답:', errorText);
      setMessage(`게시물 등록 실패: ${errorText}`);
    }
  } catch (error) {
    console.error('게시물 등록 오류:', error);
    setMessage(`오류가 발생했습니다: ${error.message}`);
  } finally {
    setIsSubmitting(false);
  }
};

  // 로그인 상태가 아니면 로딩 표시 또는 빈 화면 반환
  if (!isLoggedIn) {
    return <div className="text-center py-10">인증 확인 중...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">게시물 등록</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded text-center ${
          message.includes('성공') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">제목</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">가격</label>
          <div className="relative">
            <input
              type="text"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full p-2 border rounded pr-8"
              required
              disabled={isSubmitting}
              placeholder="숫자만 입력"
            />
            <span className="absolute right-3 top-2 text-gray-500">원</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">내용</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows="6"
            required
            disabled={isSubmitting}
          ></textarea>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">이미지</label>
          <div className="mt-1 flex items-center">
            <input
              id="image-upload"
              type="file"
              name="image"
              onChange={handleChange}
              className="hidden"
              accept="image/*"
              disabled={isSubmitting}
            />
            <label
              htmlFor="image-upload"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded cursor-pointer hover:bg-gray-300 flex items-center"
            >
              <Image className="w-4 h-4 mr-2" />
              이미지 선택
            </label>
          </div>
          
          {imagePreview && (
            <div className="mt-3 relative">
              <img 
                src={imagePreview} 
                alt="미리보기" 
                className="w-full max-h-64 object-contain border rounded"
              />
              <button
                type="button"
                onClick={clearImagePreview}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/posts')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            disabled={isSubmitting}
          >
            취소
          </button>
          <button
            type="submit"
            className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostForm;