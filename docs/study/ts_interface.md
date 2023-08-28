---
title: 接口
order: 3
group: TypeScript
toc: content
---

TypeScript 的核心原则之一是对值所具有的结构进行类型检查。 它有时被称做“鸭式辨型
法”或“结构性子类型化”。 在 TypeScript 里，接口的作用就是为这些类型命名和为你的代
码或第三方代码定义契约。

### 接口

接口通过 interface 关键字来定义一个接口，接口只会关注值的外形，只要传入的对象满
足提到的必要条件，就是被允许的。另外类型检查器不会去检查属性的顺序，只要相应的属
性存在并且类型也是对的就可以。

```ts
interface LabelleValue {
  label: string;
}

function printLabel(labelledObj: LabelleValue) {
  console.log(labelledObj.label);
}
```

参数中一定会有一个 label 的属性。

### 可选属性

接口的可选属性，是在定义接口的属性名后加问号(?).表示属性并不是必须得。可选属性的
好处之一是可以对可能存在的属性进行预定义，好处之二是可以捕获引用了不存在的属性时
的错误。

```ts
interface Color {
  name: string;
  size?: number;
}
```

size 属性是可选属性，在校验的时候，并不是强制校验必须含有 size 属性，这一点和
name 属性完全不同。

### 只读属性

只读属性用 readonly 关键字表示，表示对象的属性只能在对象刚刚创建的时候修改其值。

```ts
interface Color {
  readonly name: string;
  readonly size: string;
}
```

### 函数类型

为了使用接口表示函数类型，我们需要给接口定义一个调用签名。 它就像是一个只有参数
列表和返回值类型的函数定义。参数列表里的每个参数都需要名字和类型。

```ts
interface SearchFunc {
  (source: string, subString: string): boolean;
}
```

这样定义后，我们可以像使用其它接口一样使用这个函数类型的接口。 下例展示了如何创
建一个函数类型的变量，并将一个同类型的函数赋值给这个变量。

```ts
let mySearch: SearchFunc;
mySearch = function (source: string, subString: string) {
  let result = source.search(subString);
  return result > -1;
};
```

对于函数类型的类型检查来说，函数的参数名不需要与接口里定义的名字相匹配。 比如，
我们使用下面的代码重写上面的例子：

```ts
let mySearch: SearchFunc;
mySearch = function (src: string, sub: string): boolean {
  let result = src.search(sub);
  return result > -1;
};
```

函数的参数会逐个进行检查，要求对应位置上的参数类型是兼容的。 如果你不想指定类型
，TypeScript 的类型系统会推断出参数类型，因为函数直接赋值给了 SearchFunc 类型变
量。 函数的返回值类型是通过其返回值推断出来的（此例是 false 和 true）。 如果让这
个函数返回数字或字符串，类型检查器会警告我们函数的返回值类型与 SearchFunc 接口中
的定义不匹配。

```ts
let mySearch: SearchFunc;
mySearch = function (src, sub) {
  let result = src.search(sub);
  return result > -1;
};
```

### 可索引的类型

与使用接口描述函数类型差不多，我们也可以描述那些能够“通过索引得到”的类型
.TypeScript 支持两种索引签名：字符串和数字。 可以同时使用两种类型的索引，但是数
字索引的返回值必须是字符串索引返回值类型的子类型。 这是因为当使用 number 来索引
时，JavaScript 会将它转换成 string 然后再去索引对象。 也就是说用 100（一个
number）去索引等同于使用"100"（一个 string）去索引，因此两者需要保持一致。

```ts
interface NumberDictionary {
  [index: string]: number;
  length: number; // 可以，length是number类型
  name: string; // 错误，`name`的类型与索引类型返回值的类型不匹配
}
```

最后索引签名也可以是只读，这样就防止了给索引赋值。

### 类类型实现接口

TypeScript 也能够用它来明确的强制一个类去符合某种契约。你也可以在接口中描述一个
方法，在类里实现它，如同下面的 setTime 方法一样：

```ts
interface ClockInterface {
  currentTime: Date;
  setTime(d: Date);
}

class Clock implements ClockInterface {
  currentTime: Date;
  setTime(d: Date) {
    this.currentTime = d;
  }
  constructor(h: number, m: number) {}
}
```

接口描述了类的公共部分，而不是公共和私有两部分。 它不会帮你检查类是否具有某些私
有成员。

### 类静态部分与实例部分的区别

当你操作类和接口的时候，你要知道类是具有两个类型的：静态部分的类型和实例的类型。
你会注意到，当你用构造器签名去定义一个接口并试图定义一个类去实现这个接口时会得到
一个错误：

```ts
interface ClockConstructor {
  new (hour: number, minute: number);
}

class Clock implements ClockConstructor {
  currentTime: Date;
  constructor(h: number, m: number) {}
}
```

这里因为当一个类实现了一个接口时，只对其实例部分进行类型检查。 constructor 存在
于类的静态部分，所以不在检查的范围内。

因此，我们应该直接操作类的静态部分。 看下面的例子，我们定义了两个接口，
ClockConstructor 为构造函数所用和 ClockInterface 为实例方法所用。 为了方便我们定
义一个构造函数 createClock，它用传入的类型创建实例。

```ts
interface ClockConstructor {
  new (hour: number, minute: number): ClockInterface;
}
interface ClockInterface {
  tick();
}

function createClock(
  ctor: ClockConstructor,
  hour: number,
  minute: number,
): ClockInterface {
  return new ctor(hour, minute);
}

class DigitalClock implements ClockInterface {
  constructor(h: number, m: number) {}
  tick() {
    console.log('beep beep');
  }
}
class AnalogClock implements ClockInterface {
  constructor(h: number, m: number) {}
  tick() {
    console.log('tick tock');
  }
}

let digital = createClock(DigitalClock, 12, 17);
let analog = createClock(AnalogClock, 7, 32);
```

因为 createClock 的第一个参数是 ClockConstructor 类型，在
createClock(AnalogClock, 7, 32)里，会检查 AnalogClock 是否符合构造函数签名。

### 继承接口

和类一样，接口也可以相互继承。 这让我们能够从一个接口里复制成员到另一个接口里，
可以更灵活地将接口分割到可重用的模块里。

```ts
interface Shape {
  color: string;
}

interface Square extends Shape {
  sideLength: number;
}

let square = <Square>{};
square.color = 'blue';
square.sideLength = 10;
```

一个接口可以继承多个接口，创建出多个接口的合成接口。

```ts
interface Shape {
  color: string;
}

interface PenStroke {
  penWidth: number;
}

interface Square extends Shape, PenStroke {
  sideLength: number;
}

let square = <Square>{};
square.color = 'blue';
square.sideLength = 10;
square.penWidth = 5.0;
```

### 混合类型

先前我们提过，接口能够描述 JavaScript 里丰富的类型。 因为 JavaScript 其动态灵活
的特点，有时你会希望一个对象可以同时具有上面提到的多种类型。

一个例子就是，一个对象可以同时做为函数和对象使用，并带有额外的属性。

```ts
interface Counter {
  (start: number): string;
  interval: number;
  reset(): void;
}

function getCounter(): Counter {
  let counter = <Counter>function (start: number) {};
  counter.interval = 123;
  counter.reset = function () {};
  return counter;
}

let c = getCounter();
c(10);
c.reset();
c.interval = 5.0;
```

在使用 JavaScript 第三方库的时候，你可能需要像上面那样去完整地定义类型。

### 接口继承类

当接口继承了一个类类型时，它会继承类的成员但不包括其实现。 就好像接口声明了所有
类中存在的成员，但并没有提供具体实现一样。 接口同样会继承到类的 private 和
protected 成员。 这意味着当你创建了一个接口继承了一个拥有私有或受保护的成员的类
时，这个接口类型只能被这个类或其子类所实现（implement）。

当你有一个庞大的继承结构时这很有用，但要指出的是你的代码只在子类拥有特定属性时起
作用。 这个子类除了继承至基类外与基类没有任何关系。 例：

```ts
class Control {
  private state: any;
}

interface SelectableControl extends Control {
  select(): void;
}

class Button extends Control implements SelectableControl {
  select() {}
}

class TextBox extends Control {
  select() {}
}

// 错误：“Image”类型缺少“state”属性。
class Image implements SelectableControl {
  select() {}
}

class Location {}
```

在上面的例子里，SelectableControl 包含了 Control 的所有成员，包括私有成员
state。 因为 state 是私有成员，所以只能够是 Control 的子类们才能实现
SelectableControl 接口。 因为只有 Control 的子类才能够拥有一个声明于 Control 的
私有成员 state，这对私有成员的兼容性是必需的。

在 Control 类内部，是允许通过 SelectableControl 的实例来访问私有成员 state 的。
实际上， SelectableControl 接口和拥有 select 方法的 Control 类是一样的。 Button
和 TextBox 类是 SelectableControl 的子类（因为它们都继承自 Control 并有 select
方法），但 Image 和 Location 类并不是这样的。
