import React, { useState } from 'react';

const Alert = ({ children, className = "" }) => (
  <div className={`p-4 mb-4 rounded-lg bg-blue-100 text-blue-700 ${className}`}>
    {children}
  </div>
);


const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const apiFormData = new FormData();
      apiFormData.append('email', formData.email);
      apiFormData.append('password', formData.password);
  
      const response = await fetch('http://localhost:8080/api/signin', {
        method: 'POST',
        //mode: 'no-cors', // 추가
        credentials: 'include',
        body: apiFormData
      });
  
      const responseBody = await response.text();
      console.log('Status:', response.status);
      console.log('Response:', responseBody);  // 이 부분 확인
  
      if (response.ok && responseBody.includes('successful authentication')) {
        localStorage.setItem('jwtToken', responseBody);
        setMessage('로그인 성공!');
      } else {
        console.log('Response:', response);
        console.log('Body:', responseBody);
        setMessage('로그인 실패. 이메일과 비밀번호를 확인해주세요.');
      }
    } catch (error) {
      console.log('Error details:', error);  // 에러 상세 내용
      setMessage('로그인 오류: ' + error.message);
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
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="mr-2"
            />
            <label htmlFor="remember" className="text-sm">로그인 상태 유지</label>
          </div>
          <a href="#" className="text-sm text-blue-500 hover:underline">
            비밀번호 찾기
          </a>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-300"
        >
          로그인
        </button>
        <div className="text-center mt-4">
          <span className="text-sm">
            아직 계정이 없으신가요? {' '}
            <a href="/signup" className="text-blue-500 hover:underline">
              회원가입
            </a>
          </span>
        </div>
      </form>
    </div>
  );
};


const SignUp = () => {
  const [formData, setFormData] = useState({
    email: '',
    nickname: '',
    password: '',
    confirmPassword: ''
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 비밀번호 일치 확인
    if (formData.password !== formData.confirmPassword) {
      setMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      // FormData 객체 생성 (multipart/form-data 형식)
      const apiFormData = new FormData();
      apiFormData.append('email', formData.email);
      apiFormData.append('nickname', formData.nickname);
      apiFormData.append('password', formData.password);

      // fetch API 사용
      const response = await fetch('http://localhost:8080/api/signup', {
        method: 'POST',
        body: apiFormData
      });

      // 응답 확인
      const result = await response.text();
      
      if (result === 'ok') {
        setMessage('회원가입이 완료되었습니다.');
      } else {
        setMessage('회원가입 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      setMessage('회원가입 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">회원가입</h2>
      {message && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
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
          />
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
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          가입하기
        </button>
      </form>
    </div>
  );
};

const UpdateProfile = () => {
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmNewPassword) {
      setMessage('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    setMessage('회원정보가 수정되었습니다.');
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">회원정보 수정</h2>
      {message && <Alert>{message}</Alert>}
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
            required
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
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">새 비밀번호 확인</label>
          <input
            type="password"
            name="confirmNewPassword"
            value={formData.confirmNewPassword}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          수정하기
        </button>
      </form>
    </div>
  );
};

const DeleteAccount = () => {
  const [password, setPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!confirmDelete) {
      setMessage('회원탈퇴를 확인해주세요.');
      return;
    }
    setMessage('회원탈퇴가 완료되었습니다.');
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-red-600">회원탈퇴</h2>
      {message && <Alert className="bg-red-100 text-red-700">{message}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="confirm-delete"
            checked={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="confirm-delete" className="text-sm text-gray-600">
            회원탈퇴를 진행하시겠습니까? 탈퇴 시 모든 데이터가 삭제됩니다.
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
        >
          탈퇴하기
        </button>
      </form>
    </div>
  );
};

const UserManagement = () => {
  const [activeComponent, setActiveComponent] = useState('signup');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center space-x-4 mb-8">
      <button
          onClick={() => setActiveComponent('signin')}
          className={`px-4 py-2 rounded ${
            activeComponent === 'signin' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          로그인
        </button>
        <button
          onClick={() => setActiveComponent('signup')}
          className={`px-4 py-2 rounded ${
            activeComponent === 'signup' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          회원가입
        </button>
        <button
          onClick={() => setActiveComponent('update')}
          className={`px-4 py-2 rounded ${
            activeComponent === 'update' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          정보수정
        </button>
        <button
          onClick={() => setActiveComponent('delete')}
          className={`px-4 py-2 rounded ${
            activeComponent === 'delete' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          회원탈퇴
        </button>
      </div>

      {activeComponent === 'signin' && <SignIn />}
      {activeComponent === 'signup' && <SignUp />}
      {activeComponent === 'update' && <UpdateProfile />}
      {activeComponent === 'delete' && <DeleteAccount />}
    </div>
  );
};

export default UserManagement;