export interface FriendLink {
    name: string;
    url: string;
    description: string;
    avatar?: string;
}

/**
 * 友链数据保持为普通静态数据，避免为一张很少变化的列表引入运行时请求。
 * 新增项目时请同时填写名称、地址和一句简短介绍；头像为可选项。
 */
export const friends: FriendLink[] = [];
