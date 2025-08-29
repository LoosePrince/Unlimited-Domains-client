// 前端验证规则，与后端保持一致

// 用户名验证
export const validateUsername = (username) => {
  if (!username || username.trim().length === 0) {
    return { isValid: false, message: '用户名不能为空' };
  }

  if (username.length < 3 || username.length > 20) {
    return { isValid: false, message: '用户名长度必须在3-20个字符之间' };
  }

  // 只允许字母、数字、下划线和中文
  const usernameRegex = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, message: '用户名只能包含字母、数字、下划线和中文' };
  }

  return { isValid: true, message: '' };
};

// 邮箱验证
export const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return { isValid: false, message: '邮箱不能为空' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: '请输入有效的邮箱地址' };
  }

  return { isValid: true, message: '' };
};

// 密码验证
export const validatePassword = (password) => {
  if (!password || password.length === 0) {
    return { isValid: false, message: '密码不能为空' };
  }

  if (password.length < 6 || password.length > 50) {
    return { isValid: false, message: '密码长度必须在6-50个字符之间' };
  }

  // 必须包含至少一个字母和一个数字
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)/;
  if (!passwordRegex.test(password)) {
    return { isValid: false, message: '密码必须包含至少一个字母和一个数字' };
  }

  return { isValid: true, message: '' };
};

// 确认密码验证
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword.length === 0) {
    return { isValid: false, message: '请确认密码' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, message: '两次输入的密码不一致' };
  }

  return { isValid: true, message: '' };
};

// 表单验证
export const validateForm = (formData, formType) => {
  const errors = {};

  if (formType === 'register') {
    // 注册表单验证
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      errors.username = usernameValidation.message;
    }

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message;
    }

    const confirmPasswordValidation = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (!confirmPasswordValidation.isValid) {
      errors.confirmPassword = confirmPasswordValidation.message;
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = '请同意服务条款和隐私政策';
    }
  } else if (formType === 'login') {
    // 登录表单验证
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
    }

    if (!formData.password || formData.password.length === 0) {
      errors.password = '密码不能为空';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// 实时验证（用于输入时显示错误）
export const validateField = (fieldName, value, formData = {}) => {
  switch (fieldName) {
    case 'username':
      return validateUsername(value);
    case 'email':
      return validateEmail(value);
    case 'password':
      return validatePassword(value);
    case 'confirmPassword':
      return validateConfirmPassword(formData.password, value);
    default:
      return { isValid: true, message: '' };
  }
};
