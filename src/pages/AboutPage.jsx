import React from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const AboutPage = () => {
  return (
    <div className="gradient-bg min-h-screen">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="ornament absolute top-24 left-16 w-14 h-14 opacity-30"></div>
        <div className="ornament absolute bottom-24 right-24 w-16 h-16 opacity-25"></div>
      </div>

      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-light text-slate-700 mb-4 text-glow">关于 · 无限域</h1>
          <p className="text-slate-600 max-w-3xl mx-auto">站在巨人的肩膀上，创建独属于你的故事。这里是一个以分支创作为核心、支持协作与探索的小说平台。</p>
        </header>

        <section className="mb-12 bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 card-shadow">
          <h2 className="text-2xl font-medium text-slate-700 mb-4">项目愿景</h2>
          <p className="text-slate-600 leading-7">
            无限域是一个支持分支创作与多样阅读路径的小说社区，探索故事的无限可能。
          </p>
        </section>

        <section className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 card-shadow">
            <h3 className="text-xl font-medium text-slate-700 mb-3">核心概念 · 小说类型</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li><span className="font-medium text-slate-700">作者独创</span>：作者完全掌控，默认他人不可分支；作者可自启分支并邀请他人。</li>
              <li><span className="font-medium text-slate-700">山外有山</span>：允许他人在作者章节后分支；作者审核可选；作者不再修改正本。</li>
              <li><span className="font-medium text-slate-700">无限点</span>：任何用户可在任意章节分支，形成网状创作；审核自动处理。</li>
              <li><span className="font-medium text-slate-700">传统</span>：不允许分支，其余与作者独创一致。</li>
            </ul>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 card-shadow">
            <h3 className="text-xl font-medium text-slate-700 mb-3">分支机制</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>章节具唯一 ID；分支默认继承设定，允许有限调整。</li>
              <li>章节类型：默认、尾接（可分支不可续写）、结局（不可分支续写）。</li>
              <li>标签用于分类与搜索；结构在模式下呈树状或网状。</li>
            </ul>
          </div>
        </section>

        <section className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 card-shadow">
            <h3 className="text-xl font-medium text-slate-700 mb-3">阅读模式</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>创建者推荐阅读线：作为默认阅读线。</li>
              <li>热门阅读线：依据点赞、阅读、评论、收藏、分享等实时统计生成。</li>
              <li>自定义阅读线：读者自由拼接并可保存与分享。</li>
              <li>随机漫步：系统随机分支，提供意外之旅。</li>
              <li>其它：思维导图式分支选择、阅读历史与进度、阅读设置与书签、沉浸模式等。</li>
            </ul>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 card-shadow">
            <h3 className="text-xl font-medium text-slate-700 mb-3">社区与版权</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>社区：章节可点赞、评论、收藏、分享；关注创作者；支持举报；声望预留。</li>
              <li>打赏：通过创作者收款码跳转实现。</li>
              <li>版权：上传内容需具备版权或授权；侵权“通知-删除”流程。</li>
              <li>模式版权：作者独创保留完整版权；协作模式默认 CC BY-SA 类共享。</li>
            </ul>
          </div>
        </section>

        <section className="mb-12 bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 card-shadow">
          <h3 className="text-xl font-medium text-slate-700 mb-3">数据与技术栈</h3>
          <div className="text-slate-600 space-y-3">
            <p>数据导出：支持按自定义阅读线导出公开有效章节，禁止一次性整本导出与多分叉线路导出。</p>
            <p>技术：前端 React + Tailwind（思维导图可选 D3.js）；后端 Node.js（规划 GraphQL）与 PostgreSQL；容器采用 Docker。</p>
          </div>
        </section>

        <section className="mb-12 bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 card-shadow">
          <h3 className="text-xl font-medium text-slate-700 mb-3">开发与联系</h3>
          <p className="text-slate-600">本项目为公益、探索性产品，欢迎参与讨论与贡献，一起打磨更好的创作与阅读体验。</p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;


