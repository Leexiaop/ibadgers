---
title: 基础数据类型
order: 1
group: TypeScript
toc: content
---

Typescript 的基础数据类型和 JavaScript 的基础数据类型基本一样。

### 布尔值 Boolean

值为 true 或者是 false 的就是布尔值，这在其他语言里也一样。

```ts
let isDone: boolean = true;
```

### 数字 Number

Typescript 里的数都是浮点数，都是 number 类型，除了支持十进制和十六进制，还支持
了二进制和八进制。

```ts
let decLiteral: number = 6;
let hexLiteral: number = 0xf00d;
let binaryLiteral: number = 0b1010;
let octalLiteral: number = 0o744;
```

### 字符串 String

用双引号（""）或者是单引号（''）表示的内容就是字符串，string。

```ts
let name: string = 'xiaoming';
```

还可以通过反引号（``）定义模版字符串：

```ts
let name: string = '小米';
let sentence: string = `他的名字叫:${name}`; //  他的名字叫:小米
```

### 数组 Array

定义数组的方式有俩种：

- 第一种可以在元素类型后面接上[],表示由此类型元素组成的一个数组

```ts
let list: number[] = [1, 2, 3];
```

- 第二种可以使用数组泛型，Array<元素类型>

```ts
let list: Array<number> = [1, 2, 3];
```

### 元组 Tuple

元组类型允许表示一个已知元素数量和类型的数组，各元素的类型不必相同。

```ts
// Declare a tuple type
let x: [string, number];
// Initialize it
x = ['hello', 10]; // OK
// Initialize it incorrectly
x = [10, 'hello']; // Error
```

### 枚举

enum 类型是对 JavaScript 标准数据类型的一个补充。

```ts
enum Color {
  Red,
  Green,
  Blue,
}
let c: Color = Color.Green;
```

默认情况下，从 0 开始为元素编号。 你也可以手动的指定成员的数值。枚举类型提供的一
个便利是你可以由枚举的值得到它的名字。

### Any

我们在编程阶段还不清楚类型的变量指定一个类型，可以是 any，它允许你在编译时可选择
地包含或移除类型检查。

```ts
let notSure: any = 4;
notSure.ifItExists(); // okay, ifItExists might exist at runtime
notSure.toFixed(); // okay, toFixed exists (but the compiler doesn't check)

let prettySure: Object = 4;
prettySure.toFixed(); // Error: Property 'toFixed' doesn't exist on type 'Object'.
```

### void

某种程度上来说，void 类型像是与 any 类型相反，它表示没有任何类型。 当一个函数没
有返回值时，你通常会见到其返回值类型是 void,声明一个 void 类型的变量没有什么大用
，因为你只能为它赋予 undefined 和 null。

```ts
function warnUser(): void {
  console.log('This is my warning message');
}

let unusable: void = undefined;
```

### Null 和 Undefined

TypeScript 里，undefined 和 null 两者各自有自己的类型分别叫做 undefined 和
null。 和 void 相似，它们的本身的类型用处不是很大：

```ts
// Not much else we can assign to these variables!
let u: undefined = undefined;
let n: null = null;
```

默认情况下 null 和 undefined 是所有类型的子类型。 就是说你可以把 null 和
undefined 赋值给 number 类型的变量。

然而，当你指定了--strictNullChecks 标记，null 和 undefined 只能赋值给 void 和它
们各自。 这能避免 很多常见的问题。 也许在某处你想传入一个 string 或 null 或
undefined，你可以使用联合类型 string | null | undefined。

### Never

never 类型表示的是那些永不存在的值的类型。never 类型是任何类型的子类型，也可以赋
值给任何类型；然而，没有类型是 never 的子类型或可以赋值给 never 类型（除了 never
本身之外）。 即使 any 也不可以赋值给 never。

```ts
// 返回never的函数必须存在无法达到的终点
function error(message: string): never {
  throw new Error(message);
}

// 推断的返回值类型为never
function fail() {
  return error('Something failed');
}

// 返回never的函数必须存在无法达到的终点
function infiniteLoop(): never {
  while (true) {}
}
```

### object

object 表示非原始类型，也就是除 number，string，boolean，symbol，null 或
undefined 之外的类型。

使用 object 类型，就可以更好的表示像 Object.create 这样的 API。

```ts
declare function create(o: object | null): void;

create({ prop: 0 }); // OK
create(null); // OK

create(42); // Error
create('string'); // Error
create(false); // Error
create(undefined); // Error
```

### 断言类型

类型断言有两种形式：

- 尖括号

  ```ts
  let someValue: any = 'this is a string';

  let strLength: number = (<string>someValue).length;
  ```

- as 语法

  ```ts
  let someValue: any = 'this is a string';

  let strLength: number = (someValue as string).length;
  ```
