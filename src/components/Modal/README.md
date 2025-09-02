# 统一弹窗组件使用指南

本组件提供了四种类型的弹窗：普通弹窗、表单弹窗、状态弹窗和临时消息（Toast）。

## 安装和配置

### 1. 在App.jsx中添加ModalProvider

```jsx
import { ModalProvider } from './components/Modal';

function App() {
  return (
    <ModalProvider>
      {/* 你的应用内容 */}
    </ModalProvider>
  );
}
```

### 2. 在组件中使用

```jsx
import { useModal } from '../components/Modal';

const YourComponent = () => {
  const modal = useModal();
  
  // 使用各种弹窗方法
};
```

## API 文档

### 普通弹窗

#### 基础用法

```jsx
// 成功提示
modal.showSuccess({
  title: '操作成功',
  message: '您的操作已成功完成！',
  confirmText: '知道了'
});

// 错误提示
modal.showError({
  title: '操作失败',
  message: '网络连接失败，请检查网络设置',
  confirmText: '重试',
  onConfirm: () => {
    // 重试逻辑
  }
});

// 警告提示
modal.showWarning({
  title: '注意',
  message: '此操作可能会影响数据，是否继续？',
  showCancel: true,
  confirmText: '继续',
  cancelText: '取消',
  onConfirm: () => {
    // 确认操作
  },
  onCancel: () => {
    // 取消操作
  }
});
```

#### 确认对话框

```jsx
// 删除确认
modal.showConfirm({
  type: 'warning',
  title: '确认删除',
  message: '删除后无法恢复，确定要删除这个项目吗？',
  confirmText: '删除',
  cancelText: '取消',
  onConfirm: () => {
    // 执行删除
  }
});
```

### 表单弹窗

```jsx
const [formData, setFormData] = useState({ name: '', email: '' });
const [loading, setLoading] = useState(false);

modal.showForm({
  title: '编辑用户信息',
  confirmText: '保存',
  cancelText: '取消',
  loading: loading,
  confirmDisabled: !formData.name || !formData.email,
  children: (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          姓名
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="请输入姓名"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          邮箱
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="请输入邮箱"
        />
      </div>
    </div>
  ),
  onConfirm: async () => {
    setLoading(true);
    try {
      await saveUserInfo(formData);
      modal.showSuccessToast('保存成功');
      // 需要手动关闭表单弹窗
      modal.closeModal(modalId);
    } catch (error) {
      modal.showErrorToast('保存失败');
    } finally {
      setLoading(false);
    }
  }
});
```

### 状态弹窗

```jsx
// 显示加载状态
const statusModalId = modal.showStatus({
  children: (
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-600">正在处理，请稍候...</p>
    </div>
  )
});

// 处理完成后关闭
setTimeout(() => {
  modal.closeModal(statusModalId);
}, 3000);
```

### Toast 消息

```jsx
// 成功消息
modal.showSuccessToast('操作成功！');

// 错误消息
modal.showErrorToast('网络连接失败');

// 警告消息
modal.showWarningToast('请先登录');

// 信息消息
modal.showInfoToast('系统将在5分钟后维护');

// 自定义配置
modal.showToast({
  type: 'success',
  message: '文件上传成功',
  duration: 5000, // 5秒后关闭
  position: 'top-right'
});
```

## 配置选项

### 普通弹窗选项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| type | string | 'info' | 弹窗类型：'success', 'warning', 'error', 'info' |
| title | string | - | 标题 |
| message | string | - | 正文内容 |
| confirmText | string | '确定' | 确认按钮文字 |
| cancelText | string | '取消' | 取消按钮文字 |
| showCancel | boolean | false | 是否显示取消按钮 |
| closable | boolean | true | 是否可以通过ESC或点击遮罩关闭 |
| darkMode | boolean | false | 是否启用夜间模式 |
| onConfirm | function | - | 确认回调 |
| onCancel | function | - | 取消回调 |

## 夜间模式支持

所有弹窗组件都支持夜间模式，通过 `darkMode` 参数控制：

```jsx
// 夜间模式弹窗
modal.showSuccess({
  title: '操作成功',
  message: '数据保存成功！',
  darkMode: true
});

// 夜间模式表单弹窗
modal.showForm({
  title: '编辑信息',
  darkMode: true,
  children: (
    <div>
      {/* 表单内容 */}
    </div>
  )
});

// 夜间模式Toast
modal.showToast({
  type: 'success',
  message: '保存成功',
  darkMode: true
});

// 或使用快捷方法
modal.showSuccessToast('操作成功', { darkMode: true });
```

### 夜间模式特性

- **自动适配**：在夜间模式下，弹窗会自动调整背景、文字和图标颜色
- **保持可读性**：确保在深色背景下的文字对比度和可读性
- **统一风格**：与项目整体的夜间模式设计保持一致
- **按钮优化**：按钮颜色会根据夜间模式自动调整
| onConfirm | function | - | 确认回调 |
| onCancel | function | - | 取消回调 |

### 表单弹窗选项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| title | string | - | 标题 |
| children | ReactNode | - | 表单内容 |
| confirmText | string | '确定' | 确认按钮文字 |
| cancelText | string | '取消' | 取消按钮文字 |
| confirmDisabled | boolean | false | 确认按钮是否禁用 |
| loading | boolean | false | 是否显示加载状态 |
| closable | boolean | true | 是否可关闭 |
| darkMode | boolean | false | 是否启用夜间模式 |
| onConfirm | function | - | 确认回调 |
| onCancel | function | - | 取消回调 |

### Toast选项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| type | string | 'info' | 消息类型：'success', 'warning', 'error', 'info' |
| message | string | - | 消息内容 |
| duration | number | 3000 | 自动关闭时间（毫秒） |
| position | string | 'top-center' | 位置：'top-left', 'top-center', 'top-right' |
| darkMode | boolean | false | 是否启用夜间模式 |