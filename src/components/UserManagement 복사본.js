import React, { useState } from 'react';

const Alert = ({ children, className = "" }) => (
  <div className={`p-4 mb-4 rounded-lg bg-blue-100 text-blue-700 ${className}`}>
    {children}
  </div>
);

const SignUp = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setMessage('비밀번호가 일치하지 않습니다.');
      return;
    }
    setMessage('회원가입이 완료되었습니다.');
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">회원가입</h2>
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
          <label className="block text-sm font-medium mb-1">닉네임</label>
          <input
            type="text"
            name="username"
            value={formData.username}
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

      {activeComponent === 'signup' && <SignUp />}
      {activeComponent === 'update' && <UpdateProfile />}
      {activeComponent === 'delete' && <DeleteAccount />}
    </div>
  );
};

export default UserManagement;