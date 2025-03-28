import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 토큰 관리 유틸리티 함수들
const isTokenExpired = () => {
  const token = localStorage.getItem('jwtToken');
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
};

// Alert 컴포넌트
const Alert = ({ children, className = "" }) => (
  <div className={`p-4 mb-4 rounded-lg bg-blue-100 text-blue-700 ${className}`}>
    {children}
  </div>
);


// 로그인 컴포넌트
const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    const apiFormData = new FormData();
    apiFormData.append('email', formData.email);
    apiFormData.append('password', formData.password);
    
    const response = await fetch('/api/signin', {
      method: 'POST',
      body: apiFormData
    });
    
    console.log('로그인 응답:', response);
    
    if (response.ok) {
      // 토큰과 ID를 헤더에서 가져옴
      const token = response.headers.get('Authorization');
      const userId = response.headers.get('id');
      
      console.log('헤더에서 가져온 사용자 ID:', userId);
      
      // 토큰 저장
      localStorage.setItem('jwtToken', token);
      
      // 유효한 사용자 ID 확인
      let validUserId = userId;
      
      if (!validUserId) {
        try {
          // 응답 본문에서 ID 확인 시도 (헤더에 없는 경우)
          const responseText = await response.text();
          if (responseText && responseText.trim()) {
            try {
              const responseData = JSON.parse(responseText);
              validUserId = responseData.id;
              console.log('응답 본문에서 가져온 사용자 ID:', validUserId);
            } catch (parseError) {
              console.warn('JSON 파싱 실패:', parseError);
            }
          }
        } catch (bodyError) {
          console.warn('응답 본문 읽기 실패:', bodyError);
        }
      }
      
      // 여전히 ID가 없는 경우 localStorage 확인 또는 기본값 사용
      if (!validUserId) {
        validUserId = localStorage.getItem('userId');
        if (!validUserId) {
          console.warn('사용자 ID를 찾을 수 없어 기본값 사용');
          validUserId = '2'; // 문자열로 변환 (헤더 값과 일관되게)
        }
      }
      
      // GET 요청으로 사용자 정보 가져오기
      const userResponse = await fetch(`/api/user?userid=${validUserId}`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Accept': 'application/json'
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('사용자 정보 응답:', userData);
        
        // 사용자 정보 저장
        localStorage.setItem('userNickname', userData.nickname);
        localStorage.setItem('userId', userData.id);
        
        // 커스텀 이벤트 발생시켜 로그인 상태 변경 알림
        const authChangeEvent = new Event('authChange');
        window.dispatchEvent(authChangeEvent);
      } else {
        console.error('사용자 정보를 가져오는데 실패했습니다:', userResponse.statusText);
      }
      
      setMessage('로그인 성공!');
      setTimeout(() => {
        navigate('/wishlist');
      }, 1500);
    } else {
      const errorText = await response.text();
      console.error('로그인 실패 응답:', errorText);
      setMessage('로그인 실패. 이메일과 비밀번호를 확인해주세요.');
    }
  } catch (error) {
    console.error('Error details:', error);
    setMessage('로그인 오류: ' + error.message);
  } finally {
    setIsSubmitting(false);
  }
};

return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">로그인</h2>
      {message && (
        <div className={`mb-4 p-2 rounded text-center ${
          message.includes('성공') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">이메일</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">비밀번호</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            disabled={isSubmitting}
          />
        </div>
        <button
          type="submit"
          className={`w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-300 ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? '로그인 중...' : '로그인'}
        </button>
        <div className="text-center mt-4">
          <span className="text-sm">
            아직 계정이 없으신가요? {' '}
            <button 
              onClick={() => navigate('/signup')} 
              className="text-blue-500 hover:underline"
            >
              회원가입
            </button>
          </span>
        </div>
      </form>
    </div>
  );
};

//회원가입 컴포넌트
const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    nickname: '',
    password: '',
    confirmPassword: ''
  });
  
  // 프로필 이미지 상태 추가
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 이미지 업로드 핸들러 추가
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 유형 검사
      if (!file.type.match('image.*')) {
        setMessage('이미지 파일만 업로드 가능합니다.');
        return;
      }
      
      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      setProfileImage(file);
      
      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 제거 핸들러
  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview(null);
  };

  const validateForm = () => {
    if (!formData.email.includes('@')) {
      setMessage('유효한 이메일 주소를 입력해주세요.');
      return false;
    }
    if (formData.password.length < 6) {
      setMessage('비밀번호는 최소 6자 이상이어야 합니다.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setMessage('비밀번호가 일치하지 않습니다.');
      return false;
    }
    if (formData.nickname.length < 2) {
      setMessage('닉네임은 최소 2자 이상이어야 합니다.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      const apiFormData = new FormData();
      apiFormData.append('email', formData.email);
      apiFormData.append('nickname', formData.nickname);
      apiFormData.append('password', formData.password);
      
      // 프로필 이미지가 있는 경우 추가
      if (profileImage) {
        apiFormData.append('profileImage', profileImage);
      }

      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: apiFormData
      });

      console.log('Status:', response.status);
      const result = await response.text();
      console.log('Response:', result);

      if (response.ok) {
        setMessage('회원가입이 완료되었습니다!');
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
      } else {
        setMessage(result || '회원가입 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      setMessage('서버 연결 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">회원가입</h2>
      {message && (
        <div className={`mb-4 p-2 rounded text-center ${
          message.includes('완료') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">이메일</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">닉네임</label>
          <input
            type="text"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">비밀번호</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">최소 6자 이상 입력해주세요</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">비밀번호 확인</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            disabled={isSubmitting}
          />
        </div>
        
        {/* 프로필 이미지 업로드 섹션 */}
        <div>
          <label className="block text-sm font-medium mb-1">프로필 사진 (선택사항)</label>
          <div className="mt-2 flex items-center">
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Profile preview" 
                  className="h-16 w-16 rounded-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 h-6 w-6 flex items-center justify-center text-xs"
                  disabled={isSubmitting}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-2 rounded border text-sm">
                  <span>사진 선택</span>
                  <input
                    type="file"
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/*"
                    disabled={isSubmitting}
                  />
                </label>
                <span className="ml-2 text-xs text-gray-500">5MB 이하의 이미지 파일</span>
              </div>
            )}
          </div>
        </div>
        
        <button
          type="submit"
          className={`w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-300 ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? '처리중...' : '가입하기'}
        </button>
      </form>
    </div>
  );
};

// 회원정보 수정 컴포넌트
// const UpdateProfile = () => {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     email: '',
//     currentPassword: '',
//     newPassword: '',
//     confirmNewPassword: ''
//   });
  
//   const [message, setMessage] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     if (isTokenExpired()) {
//       navigate('/signin');
//       return;
//     }
//   }, [navigate]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (formData.newPassword !== formData.confirmNewPassword) {
//       setMessage('새 비밀번호가 일치하지 않습니다.');
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       const token = localStorage.getItem('jwtToken');
//       const apiFormData = new FormData();
//       apiFormData.append('email', formData.email);
//       apiFormData.append('currentPassword', formData.currentPassword);
//       apiFormData.append('newPassword', formData.newPassword);

//       const response = await fetch('/api/updateuser', {
//         method: 'PUT',
//         headers: {
//           'Authorization': token,
//         },
//         body: apiFormData
//       });

//       if (response.ok) {
//         setMessage('회원정보가 성공적으로 수정되었습니다.');
//         const newToken = response.headers.get('Authorization');
//         if (newToken) {
//           localStorage.setItem('jwtToken', newToken);
//         }
//         setTimeout(() => {
//           navigate('/');
//         }, 2000);
//       } else {
//         const result = await response.text();
//         setMessage(result || '회원정보 수정 중 오류가 발생했습니다.');
//       }
//     } catch (error) {
//       console.error('Profile update error:', error);
//       setMessage('서버 연결 중 오류가 발생했습니다.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
//       <h2 className="text-2xl font-bold mb-6 text-center">회원정보 수정</h2>
//       {message && (
//         <div className={`mb-4 p-2 rounded text-center ${
//           message.includes('성공') 
//             ? 'bg-green-100 text-green-700' 
//             : 'bg-red-100 text-red-700'
//         }`}>
//           {message}
//         </div>
//       )}
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div>
//           <label className="block text-sm font-medium mb-1">이메일</label>
//           <input
//             type="email"
//             name="email"
//             value={formData.email}
//             onChange={handleChange}
//             className="w-full p-2 border rounded"
//             required
//             disabled={isSubmitting}
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium mb-1">현재 비밀번호</label>
//           <input
//             type="password"
//             name="currentPassword"
//             value={formData.currentPassword}
//             onChange={handleChange}
//             className="w-full p-2 border rounded"
//             required
//             disabled={isSubmitting}
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium mb-1">새 비밀번호</label>
//           <input
//             type="password"
//             name="newPassword"
//             value={formData.newPassword}
//             onChange={handleChange}
//             className="w-full p-2 border rounded"
//             disabled={isSubmitting}
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium mb-1">새 비밀번호 확인</label>
//           <input
//             type="password"
//             name="confirmNewPassword"
//             value={formData.confirmNewPassword}
//             onChange={handleChange}
//             className="w-full p-2 border rounded"
//             disabled={isSubmitting}
//           />
//         </div>
//         <button
//           type="submit"
//           className={`w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-300 ${
//             isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
//           }`}
//           disabled={isSubmitting}
//         >
//           {isSubmitting ? '수정 중...' : '수정하기'}
//         </button>
//       </form>
//     </div>
//   );
// };
// const UpdateProfile = () => {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     email: '',
//     currentPassword: '',
//     newPassword: '',
//     confirmNewPassword: ''
//   });
  
//   // 프로필 이미지 상태 추가
//   const [profileImage, setProfileImage] = useState(null);
//   const [profileImageFile, setProfileImageFile] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);
  
//   const [message, setMessage] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);
  
//   // 서버 URL 설정
//   const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8080';

//   useEffect(() => {
//     if (isTokenExpired()) {
//       navigate('/signin');
//       return;
//     }
    
//     // 현재 사용자 정보 로드
//     const loadUserInfo = async () => {
//       try {
//         const token = localStorage.getItem('jwtToken');
//         const userId = localStorage.getItem('userId');
        
//         if (!token || !userId) {
//           navigate('/signin');
//           return;
//         }
        
//         const response = await fetch(`/api/user?userid=${userId}`, {
//           method: 'GET',
//           headers: {
//             'Authorization': token,
//             'Accept': 'application/json'
//           }
//         });
        
//         if (response.ok) {
//           const userData = await response.json();
//           setFormData(prev => ({
//             ...prev,
//             email: userData.email || ''
//           }));
          
//           // 프로필 이미지 URL이 있으면 미리보기 설정
//           if (userData.profileImageUrl) {
//             setProfileImage(userData.profileImageUrl);
//             setImagePreview(getProfileImageUrl(userData.profileImageUrl));
//           }
//         } else {
//           console.error('사용자 정보를 가져오는데 실패했습니다:', response.statusText);
//         }
//       } catch (error) {
//         console.error('사용자 정보 로딩 오류:', error);
//       }
//     };
    
//     loadUserInfo();
//   }, [navigate]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };
  
//   // 이미지 URL 생성 함수
//   const getProfileImageUrl = (relativePath) => {
//     if (!relativePath) return null;
//     if (relativePath.startsWith('http')) return relativePath;
//     return `${SERVER_URL}/images${relativePath}`;
//   };
  
//   // 이미지 업로드 핸들러
//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       // 파일 유형 검사
//       if (!file.type.match('image.*')) {
//         setMessage('이미지 파일만 업로드 가능합니다.');
//         return;
//       }
      
//       // 파일 크기 제한 (5MB)
//       if (file.size > 5 * 1024 * 1024) {
//         setMessage('파일 크기는 5MB 이하여야 합니다.');
//         return;
//       }

//       setProfileImageFile(file);
      
//       // 이미지 미리보기 생성
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setImagePreview(reader.result);
//       };
//       reader.readAsDataURL(file);
//     }
//   };
  
//   // 이미지 제거 핸들러
//   const handleRemoveImage = () => {
//     setProfileImageFile(null);
//     setImagePreview(profileImage ? getProfileImageUrl(profileImage) : null);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // 새 비밀번호가 입력되었다면 일치하는지 확인
//     if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
//       setMessage('새 비밀번호가 일치하지 않습니다.');
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       const token = localStorage.getItem('jwtToken');
//       const apiFormData = new FormData();
//       apiFormData.append('email', formData.email);
      
//       // 비밀번호 필드가 입력된 경우에만 포함
//       if (formData.currentPassword) {
//         apiFormData.append('currentPassword', formData.currentPassword);
//       }
      
//       if (formData.newPassword) {
//         apiFormData.append('newPassword', formData.newPassword);
//       }
      
//       // 프로필 이미지 파일이 있으면 추가
//       if (profileImageFile) {
//         apiFormData.append('profileImage', profileImageFile);
//       }

//       const response = await fetch('/api/updateuser', {
//         method: 'PUT',
//         headers: {
//           'Authorization': token,
//         },
//         body: apiFormData
//       });

//       if (response.ok) {
//         setMessage('회원정보가 성공적으로 수정되었습니다.');
        
//         // 새 토큰이 있으면 저장
//         const newToken = response.headers.get('Authorization');
//         if (newToken) {
//           localStorage.setItem('jwtToken', newToken);
//         }
        
//         // 인증 상태 업데이트 이벤트 발생
//         const event = new Event('authChange');
//         window.dispatchEvent(event);
        
//         setTimeout(() => {
//           navigate('/');
//         }, 2000);
//       } else {
//         const result = await response.text();
//         setMessage(result || '회원정보 수정 중 오류가 발생했습니다.');
//       }
//     } catch (error) {
//       console.error('Profile update error:', error);
//       setMessage('서버 연결 중 오류가 발생했습니다.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
//       <h2 className="text-2xl font-bold mb-6 text-center">회원정보 수정</h2>
//       {message && (
//         <div className={`mb-4 p-2 rounded text-center ${
//           message.includes('성공') 
//             ? 'bg-green-100 text-green-700' 
//             : 'bg-red-100 text-red-700'
//         }`}>
//           {message}
//         </div>
//       )}
//       <form onSubmit={handleSubmit} className="space-y-4">
//         {/* 프로필 이미지 업로드 섹션 */}
//         <div className="mb-6">
//           <label className="block text-sm font-medium mb-2">프로필 사진</label>
//           <div className="flex flex-col items-center">
//             {imagePreview ? (
//               <div className="relative mb-4">
//                 <img 
//                   src={imagePreview} 
//                   alt="Profile preview" 
//                   className="h-32 w-32 rounded-full object-cover"
//                 />
//                 {profileImageFile && (
//                   <button
//                     type="button"
//                     onClick={handleRemoveImage}
//                     className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 h-6 w-6 flex items-center justify-center text-xs"
//                     disabled={isSubmitting}
//                   >
//                     ✕
//                   </button>
//                 )}
//               </div>
//             ) : (
//               <div className="mb-4 h-32 w-32 bg-gray-200 rounded-full flex items-center justify-center">
//                 <span className="text-gray-500">이미지 없음</span>
//               </div>
//             )}
//             <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-2 rounded border text-sm">
//               <span>사진 {imagePreview ? '변경' : '선택'}</span>
//               <input
//                 type="file"
//                 onChange={handleImageChange}
//                 className="hidden"
//                 accept="image/*"
//                 disabled={isSubmitting}
//               />
//             </label>
//             <p className="text-xs text-gray-500 mt-1">5MB 이하의 이미지 파일</p>
//           </div>
//         </div>
        
//         <div>
//           <label className="block text-sm font-medium mb-1">이메일</label>
//           <input
//             type="email"
//             name="email"
//             value={formData.email}
//             onChange={handleChange}
//             className="w-full p-2 border rounded"
//             required
//             disabled={isSubmitting}
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium mb-1">현재 비밀번호</label>
//           <input
//             type="password"
//             name="currentPassword"
//             value={formData.currentPassword}
//             onChange={handleChange}
//             className="w-full p-2 border rounded"
//             required={formData.newPassword !== ''}
//             disabled={isSubmitting}
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium mb-1">새 비밀번호</label>
//           <input
//             type="password"
//             name="newPassword"
//             value={formData.newPassword}
//             onChange={handleChange}
//             className="w-full p-2 border rounded"
//             disabled={isSubmitting}
//           />
//           <p className="text-xs text-gray-500 mt-1">변경하지 않으려면 비워두세요</p>
//         </div>
//         <div>
//           <label className="block text-sm font-medium mb-1">새 비밀번호 확인</label>
//           <input
//             type="password"
//             name="confirmNewPassword"
//             value={formData.confirmNewPassword}
//             onChange={handleChange}
//             className="w-full p-2 border rounded"
//             disabled={isSubmitting || formData.newPassword === ''}
//           />
//         </div>
//         <button
//           type="submit"
//           className={`w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-300 ${
//             isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
//           }`}
//           disabled={isSubmitting}
//         >
//           {isSubmitting ? '수정 중...' : '수정하기'}
//         </button>
//       </form>
//     </div>
//   );
// };
const UpdateProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  
  // 프로필 이미지 상태 추가
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 서버 URL 설정
  const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8080';

  useEffect(() => {
    if (isTokenExpired()) {
      navigate('/signin');
      return;
    }
    
    // 현재 사용자 정보 로드
    const loadUserInfo = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
          navigate('/signin');
          return;
        }
        
        const response = await fetch(`/api/user?userid=${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': token,
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setFormData(prev => ({
            ...prev,
            email: userData.email || ''
          }));
          
          // 프로필 이미지 URL이 있으면 미리보기 설정
          if (userData.profileImageUrl) {
            setProfileImage(userData.profileImageUrl);
            setImagePreview(getProfileImageUrl(userData.profileImageUrl));
          }
        } else {
          console.error('사용자 정보를 가져오는데 실패했습니다:', response.statusText);
        }
      } catch (error) {
        console.error('사용자 정보 로딩 오류:', error);
      }
    };
    
    loadUserInfo();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 이미지 URL 생성 함수
  const getProfileImageUrl = (relativePath) => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;
    return `${SERVER_URL}/images${relativePath}`;
  };
  
  // 이미지 업로드 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 유형 검사
      if (!file.type.match('image.*')) {
        setMessage('이미지 파일만 업로드 가능합니다.');
        return;
      }
      
      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      setProfileImageFile(file);
      
      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 이미지 제거 핸들러
  const handleRemoveImage = () => {
    setProfileImageFile(null);
    setImagePreview(profileImage ? getProfileImageUrl(profileImage) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 새 비밀번호가 입력되었다면 일치하는지 확인
    if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
      setMessage('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('jwtToken');
      const apiFormData = new FormData();
      apiFormData.append('email', formData.email);
      
      // 비밀번호 필드가 입력된 경우에만 포함
      if (formData.currentPassword) {
        apiFormData.append('currentPassword', formData.currentPassword);
      }
      
      if (formData.newPassword) {
        apiFormData.append('newPassword', formData.newPassword);
      }
      
      // 프로필 이미지 파일이 있으면 추가
      if (profileImageFile) {
        apiFormData.append('profileImage', profileImageFile);
      }

      const response = await fetch('/api/updateuser', {
        method: 'PUT',
        headers: {
          'Authorization': token,
        },
        body: apiFormData
      });

      if (response.ok) {
        setMessage('회원정보가 성공적으로 수정되었습니다.');
        
        // 새 토큰이 있으면 저장
        const newToken = response.headers.get('Authorization');
        if (newToken) {
          localStorage.setItem('jwtToken', newToken);
        }
        
        // 인증 상태 업데이트 이벤트 발생
        const event = new Event('authChange');
        window.dispatchEvent(event);
        
        // 프로필 이미지가 변경되었으면 페이지 새로고침
        if (profileImageFile) {
          setTimeout(() => {
            window.location.reload(); // 페이지 새로고침
          }, 500); // 짧은 지연 후 새로고침
        }
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        const result = await response.text();
        setMessage(result || '회원정보 수정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage('서버 연결 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">회원정보 수정</h2>
      {message && (
        <div className={`mb-4 p-2 rounded text-center ${
          message.includes('성공') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 프로필 이미지 업로드 섹션 */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">프로필 사진</label>
          <div className="flex flex-col items-center">
            {imagePreview ? (
              <div className="relative mb-4">
                <img 
                  src={imagePreview} 
                  alt="Profile preview" 
                  className="h-32 w-32 rounded-full object-cover"
                />
                {profileImageFile && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 h-6 w-6 flex items-center justify-center text-xs"
                    disabled={isSubmitting}
                  >
                    ✕
                  </button>
                )}
              </div>
            ) : (
              <div className="mb-4 h-32 w-32 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-500">이미지 없음</span>
              </div>
            )}
            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-2 rounded border text-sm">
              <span>사진 {imagePreview ? '변경' : '선택'}</span>
              <input
                type="file"
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
                disabled={isSubmitting}
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">5MB 이하의 이미지 파일</p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">이메일</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">현재 비밀번호</label>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required={formData.newPassword !== ''}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">새 비밀번호</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">변경하지 않으려면 비워두세요</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">새 비밀번호 확인</label>
          <input
            type="password"
            name="confirmNewPassword"
            value={formData.confirmNewPassword}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            disabled={isSubmitting || formData.newPassword === ''}
          />
        </div>
        <button
          type="submit"
          className={`w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-300 ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? '수정 중...' : '수정하기'}
        </button>
      </form>
    </div>
  );
};

// 회원탈퇴 컴포넌트
const DeleteAccount = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isTokenExpired()) {
      navigate('/signin');
      return;
    }
  }, [navigate]);

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!confirmDelete) {
  //     setMessage('회원탈퇴를 확인해주세요.');
  //     return;
  //   }

  //   setIsSubmitting(true);

  //   try {
  //     const token = localStorage.getItem('jwtToken');
  //     const formData = new FormData();
  //     formData.append('password', password);

  //     const response = await fetch('http://localhost:8080/api/deleteuser', {
  //       method: 'DELETE',
  //       headers: {
  //         'Authorization': token
  //       }
  //     });

  //     if (response.ok) {
  //       setMessage('회원탈퇴가 완료되었습니다.');
  //       localStorage.clear();
  //       setTimeout(() => {
  //         navigate('/');
  //       }, 2000);
  //     } else {
  //       const result = await response.text();
  //       setMessage(result || '회원탈퇴 처리 중 오류가 발생했습니다.');
  //     }
  //   } catch (error) {
  //     console.error('Account deletion error:', error);
  //     setMessage('서버 연결 중 오류가 발생했습니다.');
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmDelete) {
      setMessage('회원탈퇴를 확인해주세요.');
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const token = localStorage.getItem('jwtToken');
      const formData = new FormData();
      formData.append('password', password);
  
      const response = await fetch('/api/deleteuser', {
        method: 'DELETE',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      });
  
      if (response.ok) {
        setMessage('회원탈퇴가 완료되었습니다.');
        localStorage.clear();
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        const result = await response.text();
        setMessage(result || '회원탈퇴 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      setMessage('서버 연결 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-red-600">회원탈퇴</h2>
      {message && (
        <div className={`mb-4 p-2 rounded text-center ${
          message.includes('완료') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="confirm-delete"
            checked={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.checked)}
            className="mr-2"
            disabled={isSubmitting}
          />
          <label htmlFor="confirm-delete" className="text-sm text-gray-600">
            회원탈퇴를 진행하시겠습니까? 탈퇴 시 모든 데이터가 삭제됩니다.
          </label>
        </div>
        <button
          type="submit"
          className={`w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition duration-300 ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? '처리중...' : '탈퇴하기'}
        </button>
      </form>
    </div>
  );
};

// 메인 UserManagement 컴포넌트
// const UserManagement = () => {
//   const navigate = useNavigate();
//   const [activeComponent, setActiveComponent] = useState('signin');

//   useEffect(() => {
//     // 토큰이 있고 만료되지 않았다면 자동으로 wishlist로 리다이렉트
//     const token = localStorage.getItem('jwtToken');
//     // if (token && !isTokenExpired() && activeComponent === 'signin') {
//     //   navigate('/wishlist');
//     // }
//   }, [activeComponent, navigate]);

//   return (
//     <>
      
//       <div className="container mx-auto px-4 py-8">
//         <div className="flex justify-center space-x-4 mb-8">
//           <button
//             onClick={() => setActiveComponent('signin')}
//             className={`px-4 py-2 rounded transition duration-300 ${
//               activeComponent === 'signin' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
//             }`}
//           >
//             로그인
//           </button>
//           <button
//             onClick={() => setActiveComponent('signup')}
//             className={`px-4 py-2 rounded transition duration-300 ${
//               activeComponent === 'signup' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
//             }`}
//           >
//             회원가입
//           </button>
//           <button
//             onClick={() => setActiveComponent('update')}
//             className={`px-4 py-2 rounded transition duration-300 ${
//               activeComponent === 'update' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
//             }`}
//           >
//             정보수정
//           </button>
//           <button
//             onClick={() => setActiveComponent('delete')}
//             className={`px-4 py-2 rounded transition duration-300 ${
//               activeComponent === 'delete' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
//             }`}
//           >
//             회원탈퇴
//           </button>
//         </div>

//         {activeComponent === 'signin' && <SignIn />}
//         {activeComponent === 'signup' && <SignUp />}
//         {activeComponent === 'update' && <UpdateProfile />}
//         {activeComponent === 'delete' && <DeleteAccount />}
//       </div>
//     </>
//   );
// };

// 메인 UserManagement 컴포넌트
const UserManagement = () => {
  const navigate = useNavigate();
  const [activeComponent, setActiveComponent] = useState('signin');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // 로그인 상태 확인
    const checkLoginStatus = () => {
      const token = localStorage.getItem('jwtToken');
      setIsLoggedIn(!!token);
      
      // 로그인 상태이고 signin/signup 페이지라면 update로 변경
      if (token && (activeComponent === 'signin' || activeComponent === 'signup')) {
        setActiveComponent('update');
      }
    };
    
    checkLoginStatus();
    
    // 인증 상태 변경 감지
    const handleAuthChange = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('authChange', handleAuthChange);
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [activeComponent]);

  // 컴포넌트 변경 핸들러
  const handleComponentChange = (component) => {
    // 로그인이 필요한 컴포넌트인데 로그인되지 않은 경우
    if ((component === 'update' || component === 'delete') && !isLoggedIn) {
      alert('로그인이 필요한 기능입니다.');
      setActiveComponent('signin');
      return;
    }
    
    // 이미 로그인된 상태에서 로그인/가입 접근 시
    if ((component === 'signin' || component === 'signup') && isLoggedIn) {
      alert('이미 로그인되어 있습니다. 로그아웃 후 이용해주세요.');
      return;
    }
    
    setActiveComponent(component);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => handleComponentChange('signin')}
            className={`px-4 py-2 rounded transition duration-300 ${
              activeComponent === 'signin' 
                ? 'bg-blue-500 text-white' 
                : isLoggedIn 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-200 hover:bg-gray-300'
            }`}
            disabled={isLoggedIn}
          >
            로그인
          </button>
          <button
            onClick={() => handleComponentChange('signup')}
            className={`px-4 py-2 rounded transition duration-300 ${
              activeComponent === 'signup' 
                ? 'bg-blue-500 text-white' 
                : isLoggedIn 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-200 hover:bg-gray-300'
            }`}
            disabled={isLoggedIn}
          >
            회원가입
          </button>
          <button
            onClick={() => handleComponentChange('update')}
            className={`px-4 py-2 rounded transition duration-300 ${
              activeComponent === 'update' 
                ? 'bg-blue-500 text-white' 
                : !isLoggedIn 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-200 hover:bg-gray-300'
            }`}
            disabled={!isLoggedIn}
          >
            정보수정
          </button>
          <button
            onClick={() => handleComponentChange('delete')}
            className={`px-4 py-2 rounded transition duration-300 ${
              activeComponent === 'delete' 
                ? 'bg-blue-500 text-white' 
                : !isLoggedIn 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-200 hover:bg-gray-300'
            }`}
            disabled={!isLoggedIn}
          >
            회원탈퇴
          </button>
        </div>

        {activeComponent === 'signin' && <SignIn />}
        {activeComponent === 'signup' && <SignUp />}
        {activeComponent === 'update' && isLoggedIn && <UpdateProfile />}
        {activeComponent === 'delete' && isLoggedIn && <DeleteAccount />}
        
        {/* 로그인 필요 안내 메시지 */}
        {!isLoggedIn && (activeComponent === 'update' || activeComponent === 'delete') && (
          <div className="text-center p-8 bg-gray-100 rounded-lg">
            <p className="text-lg">로그인이 필요한 기능입니다.</p>
            <p className="mt-2 text-gray-600">먼저 로그인해주세요.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default UserManagement;