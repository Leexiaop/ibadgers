import { defineConfig } from 'dumi';

export default defineConfig({
    themeConfig: {
        name: 'ibadgers',
        hd: {
            rules: [
                { maxWidth: 375, mode: 'vw', options: [100, 750] },
                { minWidth: 376, maxWidth: 750, mode: 'vw', options: [100, 1500] },
            ],
        },
        nav: [
            {title: 'Guide', link: '/guide'},
            {title: 'LeetCode', link: '/leetcode'},
            {title: '前端面试', link: '/interview'},
            {title: '学习进阶', link: '/study'},
            {title: '源码解析', link: '/code'},
            {title: '实用网站', link: '/program'},
            {
                title: 'Blog',
                link: 'https://leexiaop.github.io/',
            },
            {
                title: 'CSDN',
                link: 'https://blog.csdn.net/leelxp/',
            },
        ]
    },
    favicons: ['https://leexiaop.github.io/static/ibadgers/logo.png'],
    logo: 'https://leexiaop.github.io/static/ibadgers/logo.png',
    base: '/ibadgers/',
    publicPath: '/ibadgers/'
});
