'use strict';

/**
 * 数据库初始化脚本
 * 用法: npm run seed
 */
const bcrypt = require('bcryptjs');
const db     = require('./index');

async function seed() {
  console.log('\n🌱 开始初始化数据...\n');

  // ── 管理员 ────────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('admin123', 10);
  db.prepare(`
    INSERT OR IGNORE INTO users (username, password, bio)
    VALUES (?, ?, ?)
  `).run('admin', hashedPassword, '一个热爱美食与生活的人，专注于记录那些温暖的日常片段。');
  console.log('✅ 管理员账户: admin / admin123');

  // ── 分类 ──────────────────────────────────────────────────────────────────
  const categories = [
    { name: '上海味道', slug: 'shanghai',    color: '#e8673c', icon: '🥟' },
    { name: '街头小吃', slug: 'street-food', color: '#f0a500', icon: '🍢' },
    { name: '探店日记', slug: 'restaurant',  color: '#4caf7d', icon: '🏮' },
    { name: '美食故事', slug: 'food-story',  color: '#7c6af7', icon: '📖' },
    { name: '烹饪笔记', slug: 'cooking',     color: '#e91e8c', icon: '🍳' },
  ];
  const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name, slug, color, icon) VALUES (?, ?, ?, ?)');
  categories.forEach(c => insertCat.run(c.name, c.slug, c.color, c.icon));
  console.log('✅ 分类已创建');

  // ── 文章 ──────────────────────────────────────────────────────────────────
  const catMap = {};
  db.prepare('SELECT id, slug FROM categories').all().forEach(c => { catMap[c.slug] = c.id; });

  const posts = [
    {
      title: '十块钱，能在上海吃到什么？',
      slug: 'ten-yuan-shanghai',
      summary: '当大家都说上海消费高的时候，我用十块钱找到了这家让人惊艳的小笼包店。',
      content: `# 十块钱，能在上海吃到什么？\n\n在上海这座城市，十块钱能买到什么？答案让很多人惊讶——**一笼热气腾腾、皮薄汤鲜的小笼包**。\n\n## 缘起\n\n那是一个阴雨的周三下午，我撑着伞穿过老城区的弄堂，鼻尖忽然被一阵蒸笼的热气所吸引。循着香气走去，是一个不足五平方米的小铺子，老板是个五十多岁的阿姨，正在娴熟地捏着小笼包的褶皱。\n\n## 十块钱的惊喜\n\n招牌就贴在门框上：**小笼包 10元/笼（8只）**。\n\n我要了一笼，站在铺子外的小桌旁等待。大约三分钟，竹制蒸笼端上来，掀开盖子的瞬间，蒸汽扑面，淡淡的猪肉香混着姜的清香，让人食欲大开。\n\n> 小笼包讲究"轻轻提，慢慢移，先开窗，后喝汤"\n\n## 这家店的故事\n\n阿姨姓周，做小笼包已经二十三年了。她说：\n\n*"现在价格涨了，以前才八块，但面粉猪肉都涨了，没办法。但是我不会涨太多，涨太多街坊就吃不起了。"*\n\n这句话让我愣了很久。在追求利润最大化的今天，还有人在守护着"街坊也吃得起"的价格。\n\n**这，才是上海真正的味道。**`,
      cat: 'shanghai', tags: ['小笼包', '上海', '性价比', '街头美食'],
      cover: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80',
      views: 1280, likes: 86,
    },
    {
      title: '一个人的早餐：生煎、豆浆与清晨的慢时光',
      slug: 'breakfast-alone',
      summary: '清晨六点半，老城区的生煎摊刚开门，那一刻我觉得城市是温柔的。',
      content: `# 一个人的早餐\n\n清晨六点半，天还没完全亮透。\n\n## 生煎的哲学\n\n**小笼包**是优雅的——轻盈、透明、像一首小诗；\n**生煎包**是踏实的——底部焦脆金黄，满是人间烟火气。\n\n## 配一碗豆浆\n\n甜豆浆，微温，不过烫。老板说豆子是每天早上四点泡的，磨浆、过滤、熬煮，绝对不加防腐剂。\n\n## 关于一个人吃早餐这件事\n\n*在快快快的时代，偶尔慢下来，很珍贵。*`,
      cat: 'street-food', tags: ['生煎', '早餐', '豆浆', '慢生活'],
      cover: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&q=80',
      views: 963, likes: 72,
    },
    {
      title: '我学做小笼包的那些失败与顿悟',
      slug: 'making-xlb',
      summary: '第一次做烂了皮，第二次汤汁漏光，第七次终于捏出了让自己满意的褶皱。',
      content: `# 我学做小笼包的那些失败与顿悟\n\n学做小笼包，是我给自己最难的一项功课。\n\n## 失败清单\n\n**第一次**：面粉和水比例搞错，皮太厚，像肉包子。\n**第七次**：对了！\n\n## 顿悟\n\n> 所有看起来简单的东西，背后都是无数次失败摸索出来的方法论。\n\n继续练。`,
      cat: 'cooking', tags: ['小笼包', '自制', '烹饪', '学习'],
      cover: 'https://images.unsplash.com/photo-1584799068234-b7392e29e9c8?w=800&q=80',
      views: 742, likes: 95,
    },
    {
      title: '藏在写字楼地下室的苍蝇馆子',
      slug: 'hidden-restaurant',
      summary: '没有大众点评，没有外卖，只靠口耳相传活了二十年，这才是真正的宝藏小店。',
      content: `# 藏在写字楼地下室的苍蝇馆子\n\n这家店没有招牌。\n\n## 发现它\n\n下了电梯，负一层，穿过停车场，在一个不起眼的门口，推开门——七八张桌子，坐满了人。\n\n## 菜单\n\n- 红烧肉（18元）\n- 炒青菜（8元）\n- 白饭（2元）\n\n**共计28元，吃得无比满足。**\n\n老板：*"上了点评，游客来了，街坊就没位子了。"*`,
      cat: 'restaurant', tags: ['探店', '苍蝇馆子', '宝藏小店', '红烧肉'],
      cover: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80',
      views: 1547, likes: 134,
    },
    {
      title: '关于这个博客，和我的初心',
      slug: 'about-this-blog',
      summary: '为什么叫"十块钱小笼包"？因为我相信，最好的东西不一定是最贵的。',
      content: `# 关于这个博客，和我的初心\n\n## 为什么叫"十块钱小笼包"？\n\n因为那是我在上海遇到的，最让我感动的一件小事。\n\n## 我想写什么\n\n**简单说，就是平凡生活里，让人感到温暖的食物和故事。**\n\n---\n\n*希望你也能在这里，找到属于你的那个温暖瞬间。*\n\n**欢迎来到十块钱小笼包的世界。🥟**`,
      cat: 'food-story', tags: ['关于', '初心', '美食哲学'],
      cover: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=800&q=80',
      views: 2103, likes: 188,
    },
  ];

  const insertPost = db.prepare(`
    INSERT OR IGNORE INTO posts (title, slug, summary, content, cover, category_id, tags, views, likes, published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  posts.forEach(p => {
    insertPost.run(p.title, p.slug, p.summary, p.content, p.cover,
      catMap[p.cat], JSON.stringify(p.tags), p.views, p.likes);
  });
  console.log('✅ 示例文章已创建');

  console.log('\n🎉 数据初始化完成！');
  console.log('   运行 npm run dev 启动博客\n');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
