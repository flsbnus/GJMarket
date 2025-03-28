import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Image, X, ArrowLeft, Save } from 'lucide-react';

const PostEdit = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    content: '',
    status: 0
  });
  
  // 기존 이미지와 새로 추가할 이미지를 별도로 관리
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      // 로그인 상태 확인
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        navigate('/signin');
        return;
      }

      try {
        setIsLoading(true);
        
        // 게시물 정보 가져오기
        const response = await fetch(`/api/post/${postId}`, {
          method: 'GET',
          headers: {
            'Authorization': `${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('게시물을 불러오는데 실패했습니다.');
        }

        const postData = await response.json();
        
        // 현재 사용자와 게시물 작성자 비교
        const userId = localStorage.getItem('userId');
        if (postData.user?.id !== parseInt(userId)) {
          setMessage('게시물 수정 권한이 없습니다.');
          setTimeout(() => navigate(`/posts/${postId}`), 2000);
          return;
        }
        
        // 폼 데이터 설정
        setFormData({
          title: postData.title || '',
          price: postData.price || '',
          content: postData.content || '',
          status: postData.status || 0
        });
        
        // 기존 이미지 설정
        if (postData.images && postData.images.length > 0) {
          setExistingImages(postData.images);
        }
      } catch (error) {
        console.error('게시물 조회 오류:', error);
        setMessage(`오류가 발생했습니다: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [postId, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'images' && files && files.length > 0) {
      // 파일 선택시 미리보기 생성
      const selectedFiles = Array.from(files);
      
      // 새 이미지 목록에 추가
      setNewImages(prev => [...prev, ...selectedFiles]);
      
      // 마지막으로 선택한 이미지 미리보기
      const lastFile = selectedFiles[selectedFiles.length - 1];
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(lastFile);
    } else if (name === 'price') {
      // 가격은 숫자만 입력 가능하도록
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      // 일반 텍스트 필드 처리
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDeleteExistingImage = (imageId) => {
    // 삭제할 이미지 ID 목록에 추가
    setImagesToDelete(prev => [...prev, imageId]);
    
    // 화면에서 제거
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleDeleteNewImage = (index) => {
    // 새 이미지 목록에서 제거
    setNewImages(prev => prev.filter((_, i) => i !== index));
    
    // 미리보기가 없어진 경우 초기화
    if (newImages.length <= 1) {
      setImagePreview(null);
    }
  };

  const clearImagePreview = () => {
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      const token = localStorage.getItem('jwtToken');
      
      // FormData 객체 생성
      const apiFormData = new FormData();
      
      // 기본 필드 추가
      apiFormData.append('id', postId);
      apiFormData.append('title', formData.title);
      apiFormData.append('content', formData.content);
      apiFormData.append('price', formData.price || '0');
      apiFormData.append('status', formData.status);
      
      // 삭제할 이미지 ID 목록 추가
      if (imagesToDelete.length > 0) {
        imagesToDelete.forEach((id, index) => {
          apiFormData.append(`deleteImageIds[${index}]`, id);
        });
      }
      
      // 새 이미지 추가
      if (newImages.length > 0) {
        newImages.forEach(file => {
          apiFormData.append('images', file);
        });
      }

      // 수정 요청 전송
    //   const response = await fetch('/api/post/{postId}', {
    //     method: 'PUT',
    //     headers: {
    //       'Authorization': `${token}`
    //     },
    //     body: apiFormData
    //   });
    const response = await fetch(`/api/post/${postId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `${token}`
        },
        body: apiFormData
      });

      if (response.ok) {
        setMessage('게시물이 성공적으로 수정되었습니다.');
        
        // 상세 페이지로 리다이렉트
        setTimeout(() => {
          navigate(`/posts/${postId}`);
        }, 1500);
      } else {
        const errorText = await response.text();
        console.error('게시물 수정 실패 응답:', errorText);
        setMessage(`게시물 수정 실패: ${errorText}`);
      }
    } catch (error) {
      console.error('게시물 수정 오류:', error);
      setMessage(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate(`/posts/${postId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">게시물 수정</h2>
        <button
          onClick={handleGoBack}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          돌아가기
        </button>
      </div>
      
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
          <label className="block text-sm font-medium mb-1">판매 상태</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            disabled={isSubmitting}
          >
            <option value={0}>판매중</option>
            <option value={1}>예약중</option>
            <option value={2}>판매완료</option>
          </select>
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
          <label className="block text-sm font-medium mb-1">현재 이미지</label>
          {existingImages.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 my-2">
              {existingImages.map(image => (
                <div key={image.id} className="relative border rounded p-1">
                  <img 
                    src={`/images/${image.imageUrl}`} 
                    alt="상품 이미지" 
                    className="w-full h-24 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteExistingImage(image.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm my-2">
              등록된 이미지가 없습니다.
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">새 이미지 추가</label>
          <div className="mt-1 flex items-center">
            <input
              id="image-upload"
              type="file"
              name="images"
              onChange={handleChange}
              className="hidden"
              accept="image/*"
              disabled={isSubmitting}
              multiple
            />
            <label
              htmlFor="image-upload"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded cursor-pointer hover:bg-gray-300 flex items-center"
            >
              <Image className="w-4 h-4 mr-2" />
              이미지 선택
            </label>
            <span className="ml-3 text-sm text-gray-500">
              {newImages.length > 0 ? `${newImages.length}개 선택됨` : ''}
            </span>
          </div>
          
          {newImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {newImages.map((file, index) => (
                <div key={index} className="relative border rounded p-1">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={`새 이미지 ${index+1}`} 
                    className="w-full h-24 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteNewImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={handleGoBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            disabled={isSubmitting}
          >
            취소
          </button>
          <button
            type="submit"
            className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4 mr-1" />
            {isSubmitting ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostEdit;