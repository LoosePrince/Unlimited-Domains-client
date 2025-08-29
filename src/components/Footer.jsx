import React, { useState } from 'react';

const Footer = () => {
  const [modalKey, setModalKey] = useState(null);

  const modalContent = {
    features: {
      title: '分支创作',
      content: '每个章节都可创建分支，形成树状/网状结构；作者可选择不同的创作模式与分支审核策略，读者可沿不同路径阅读。'
    },
    reading: {
      title: '阅读体验',
      content: '支持推荐/热门/自定义/随机等阅读线，提供阅读历史、进度、书签、字体与主题等设置，并有沉浸模式。'
    },
    community: {
      title: '社区互动',
      content: '章节可点赞、评论、收藏、分享；可关注创作者并接收动态；提供举报通道与声望体系（预留）。本项目为公益、探索性产品，相关说明尚未完善，可能随时更改且不作保证。'
    },
    help: {
      title: '帮助中心',
      content: '常见问题、使用引导与操作说明，将持续完善。如有疑问，欢迎通过“联系我们”反馈。'
    },
    contact: {
      title: '联系我们',
      content: '本项目为公益探索，欢迎通过邮箱 pfingan@foxmail.com 与我们联系，提出建议与想法。'
    },
    feedback: {
      title: '意见反馈',
      content: '对功能、体验与内容有任何建议，欢迎反馈。你的意见将帮助我们持续改进产品。'
    },
    terms: {
      title: '服务条款',
      content: '你应遵守当地法律法规与平台规则，不得发布违法或侵权内容。平台可在必要时下架违规内容并封禁账号。本项目为公益、探索性产品，条款尚未完善，可能随时更改且不作保证。'
    },
    privacy: {
      title: '隐私政策',
      content: '我们最小化收集必要信息，仅用于提供服务与安全目的。不会出售你的个人数据。详情以正式政策为准。本项目为公益、探索性产品，政策尚未完善，可能随时更改且不作保证。'
    },
    copyright: {
      title: '版权声明',
      content: '上传即承诺拥有版权或授权并授权给平台；侵权内容经“通知-删除”流程处理。协作模式默认采用 CC BY-SA 类共享协议。本项目为公益、探索性产品，声明尚未完善，可能随时更改且不作保证。'
    }
  };

  const closeModal = () => setModalKey(null);

  const Modal = ({ title, content, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-11/12 max-w-lg mx-auto p-6">
        <div className="flex items-start justify-between mb-3">
          <h4 className="text-lg font-medium text-slate-800">{title}</h4>
          <button
            aria-label="关闭"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="text-slate-700 leading-7">
          {content}
        </div>
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <footer className="bg-slate-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-lg font-medium mb-4">无限域</h4>
            <p className="text-slate-300 text-sm">站在巨人的肩膀上，创建独属于你的故事</p>
          </div>
          <div>
            <h5 className="font-medium mb-4">产品</h5>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><button onClick={() => setModalKey('features')} className="hover:text-white transition-colors">分支创作</button></li>
              <li><button onClick={() => setModalKey('reading')} className="hover:text-white transition-colors">阅读体验</button></li>
              <li><button onClick={() => setModalKey('community')} className="hover:text-white transition-colors">社区互动</button></li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-4">支持</h5>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><button onClick={() => setModalKey('help')} className="hover:text-white transition-colors">帮助中心</button></li>
              <li><button onClick={() => setModalKey('contact')} className="hover:text-white transition-colors">联系我们</button></li>
              <li><button onClick={() => setModalKey('feedback')} className="hover:text-white transition-colors">意见反馈</button></li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-4">法律</h5>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><button onClick={() => setModalKey('terms')} className="hover:text-white transition-colors">服务条款</button></li>
              <li><button onClick={() => setModalKey('privacy')} className="hover:text-white transition-colors">隐私政策</button></li>
              <li><button onClick={() => setModalKey('copyright')} className="hover:text-white transition-colors">版权声明</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-300">
          <p>&copy; 2025 无限域. 保留所有权利.</p>
        </div>
      </div>

      {modalKey && (
        <Modal
          title={modalContent[modalKey]?.title}
          content={modalContent[modalKey]?.content}
          onClose={closeModal}
        />
      )}
    </footer>
  );
};

export default Footer;
