---
title: 类
order: 4
group: TypeScript
toc: content
---

Typescript 中的类和 Javascript 中的类几乎相同。

### 类的创建

Typescript 中类的创建和 JavaScript 中一样，也是通过 class 关键字来实现的。通过
this 来访问类中的属性，通过 new 关键字来实现对象的创建：

```ts
class Greeter {
  greeting: string;
  constructor(message: string) {
    this.greeting = message;
  }
  greet() {
    return 'Hello, ' + this.greeting;
  }
}

let greeter = new Greeter('world');
```

### 类的继承

类的继承通过 extends 关键字实现：

```ts
class Animal {
  move(distanceInMeters: number = 0) {
    console.log(`Animal moved ${distanceInMeters}m.`);
  }
}

class Dog extends Animal {
  bark() {
    console.log('Woof! Woof!');
  }
}

const dog = new Dog();
dog.bark();
dog.move(10);
dog.bark();
```

这个例子展示了最基本的继承：类从基类中继承了属性和方法。 这里， Dog 是一个 派生
类，它派生自 Animal 基类，通过 extends 关键字。 派生类通常被称作 子类，基类通常
被称作 超类。因为 Dog 继承了 Animal 的功能，因此我们可以创建一个 Dog 的实例，它
能够 bark()和 move()。看下面的例子：

```ts
class Animal {
  name: string;
  constructor(theName: string) {
    this.name = theName;
  }
  move(distanceInMeters: number = 0) {
    console.log(`${this.name} moved ${distanceInMeters}m.`);
  }
}

class Snake extends Animal {
  constructor(name: string) {
    super(name);
  }
  move(distanceInMeters = 5) {
    console.log('Slithering...');
    super.move(distanceInMeters);
  }
}

class Horse extends Animal {
  constructor(name: string) {
    super(name);
  }
  move(distanceInMeters = 45) {
    console.log('Galloping...');
    super.move(distanceInMeters);
  }
}

let sam = new Snake('Sammy the Python');
let tom: Animal = new Horse('Tommy the Palomino');

sam.move();
tom.move(34);
```

这个例子展示了一些上面没有提到的特性。 这一次，我们使用 extends 关键字创建了
Animal 的两个子类： Horse 和 Snake。

与前一个例子的不同点是，派生类包含了一个构造函数，它 必须调用 super()，它会执行
基类的构造函数。 而且，在构造函数里访问 this 的属性之前，我们 一定要调用
super()。 这个是 TypeScript 强制执行的一条重要规则。

这个例子演示了如何在子类里可以重写父类的方法。 Snake 类和 Horse 类都创建了 move
方法，它们重写了从 Animal 继承来的 move 方法，使得 move 方法根据不同的类而具有不
同的功能。 注意，即使 tom 被声明为 Animal 类型，但因为它的值是 Horse，调用
tom.move(34)时，它会调用 Horse 里重写的方法：

```
Slithering...
Sammy the Python moved 5m.
Galloping...
Tommy the Palomino moved 34m.
```

### 公共，私有与受保护的修饰符

#### public

在 Typescript 的类中的属性和方法默认都是可见的，也可以自己将属性和类标识为
public.

```ts
class Animal {
  public name: string;
  public constructor(theName: string) {
    this.name = theName;
  }
  public move(distanceInMeters: number) {
    console.log(`${this.name} moved ${distanceInMeters}m.`);
  }
}
```

#### private

当成员被标记成 private 时，它就不能在声明它的类的外部访问.

```ts
class Animal {
  private name: string;
  constructor(theName: string) {
    this.name = theName;
  }
}

new Animal('Cat').name; // 错误: 'name' 是私有的.
```

TypeScript 使用的是结构性类型系统。 当我们比较两种不同的类型时，并不在乎它们从何
处而来，如果所有成员的类型都是兼容的，我们就认为它们的类型是兼容的。

然而，当我们比较带有 private 或 protected 成员的类型的时候，情况就不同了。 如果
其中一个类型里包含一个 private 成员，那么只有当另外一个类型中也存在这样一个
private 成员， 并且它们都是来自同一处声明时，我们才认为这两个类型是兼容的。 对于
protected 成员也使用这个规则。

```ts
class Animal {
  private name: string;
  constructor(theName: string) {
    this.name = theName;
  }
}

class Rhino extends Animal {
  constructor() {
    super('Rhino');
  }
}

class Employee {
  private name: string;
  constructor(theName: string) {
    this.name = theName;
  }
}

let animal = new Animal('Goat');
let rhino = new Rhino();
let employee = new Employee('Bob');

animal = rhino;
animal = employee; // 错误: Animal 与 Employee 不兼容.
```

这个例子中有 Animal 和 Rhino 两个类， Rhino 是 Animal 类的子类。 还有一个
Employee 类，其类型看上去与 Animal 是相同的。 我们创建了几个这些类的实例，并相互
赋值来看看会发生什么。 因为 Animal 和 Rhino 共享了来自 Animal 里的私有成员定义
private name: string，因此它们是兼容的。 然而 Employee 却不是这样。当把 Employee
赋值给 Animal 的时候，得到一个错误，说它们的类型不兼容。 尽管 Employee 里也有一
个私有成员 name，但它明显不是 Animal 里面定义的那个。

#### protected

protected 修饰符与 private 修饰符的行为很相似，但有一点不同， protected 成员在派
生类中仍然可以访问。

```ts
class Person {
  protected name: string;
  constructor(name: string) {
    this.name = name;
  }
}

class Employee extends Person {
  private department: string;

  constructor(name: string, department: string) {
    super(name);
    this.department = department;
  }

  public getElevatorPitch() {
    return `Hello, my name is ${this.name} and I work in ${this.department}.`;
  }
}

let howard = new Employee('Howard', 'Sales');
console.log(howard.getElevatorPitch());
console.log(howard.name); // 错误
```

Person 类外使用 name，但是我们仍然可以通过 Employee 类的实例方法访问，因为
Employee 是由 Person 派生而来的。

构造函数也可以被标记成 protected。 这意味着这个类不能在包含它的类外被实例化，但
是能被继承。

```ts
class Person {
  protected name: string;
  protected constructor(theName: string) {
    this.name = theName;
  }
}

// Employee 能够继承 Person
class Employee extends Person {
  private department: string;

  constructor(name: string, department: string) {
    super(name);
    this.department = department;
  }

  public getElevatorPitch() {
    return `Hello, my name is ${this.name} and I work in ${this.department}.`;
  }
}

let howard = new Employee('Howard', 'Sales');
let john = new Person('John'); // 错误: 'Person' 的构造函数是被保护的.
```

#### readonly

你可以使用 readonly 关键字将属性设置为只读的。 只读属性必须在声明时或构造函数里
被初始化。

```ts
class Octopus {
  readonly name: string;
  readonly numberOfLegs: number = 8;
  constructor(theName: string) {
    this.name = theName;
  }
}
let dad = new Octopus('Man with the 8 strong legs');
dad.name = 'Man with the 3-piece suit'; // 错误! name 是只读的.
```

### 参数属性

我们可以通过在构造函数里使用 readonly 参数来创建和初始化成员，把声明和赋值合并到
一处

```ts
class Octopus {
  readonly numberOfLegs: number = 0;
  constructor(readonly name: string) {}
}
```

参数属性通过给构造函数参数前面添加一个访问限定符来声明。 使用 private 限定一个参
数属性会声明并初始化一个私有成员；对于 public 和 protected 来说也是一样。

#### 存取器

TypeScript 支持通过 getters/setters 来截取对对象成员的访问。 它能帮助你有效的控
制对对象成员的访问。

```ts
let passcode = 'secret passcode';

class Employee {
  private _fullName: string;

  get fullName(): string {
    return this._fullName;
  }

  set fullName(newName: string) {
    if (passcode && passcode == 'secret passcode') {
      this._fullName = newName;
    } else {
      console.log('Error: Unauthorized update of employee!');
    }
  }
}

let employee = new Employee();
employee.fullName = 'Bob Smith';
if (employee.fullName) {
  alert(employee.fullName);
}
```

存取器要求你将编译器设置为输出 ECMAScript 5 或更高。 不支持降级到 ECMAScript 3。
其次，只带有 get 不带有 set 的存取器自动被推断为 readonly。 这在从代码生成 .d.ts
文件时是有帮助的，因为利用这个属性的用户会看到不允许够改变它的值。

#### 静态属性

到目前为止，我们只讨论了类的实例成员，那些仅当类被实例化的时候才会被初始化的属性
。 我们也可以创建类的静态成员，这些属性存在于类本身上面而不是类的实例上。 在这个
例子里，我们使用 static 定义 origin，因为它是所有网格都会用到的属性。 每个实例想
要访问这个属性的时候，都要在 origin 前面加上类名。 如同在实例属性上使用 this.前
缀来访问属性一样，这里我们使用 Grid.来访问静态属性。

```ts
class Grid {
  static origin = { x: 0, y: 0 };
  calculateDistanceFromOrigin(point: { x: number; y: number }) {
    let xDist = point.x - Grid.origin.x;
    let yDist = point.y - Grid.origin.y;
    return Math.sqrt(xDist * xDist + yDist * yDist) / this.scale;
  }
  constructor(public scale: number) {}
}

let grid1 = new Grid(1.0); // 1x scale
let grid2 = new Grid(5.0); // 5x scale

console.log(grid1.calculateDistanceFromOrigin({ x: 10, y: 10 }));
console.log(grid2.calculateDistanceFromOrigin({ x: 10, y: 10 }));
```

#### 抽象类

抽象类做为其它派生类的基类使用。 它们一般不会直接被实例化。 不同于接口，抽象类可
以包含成员的实现细节。 abstract 关键字是用于定义抽象类和在抽象类内部定义抽象方法
。

```ts
abstract class Animal {
  abstract makeSound(): void;
  move(): void {
    console.log('roaming the earch...');
  }
}
```

抽象类中的抽象方法不包含具体实现并且必须在派生类中实现。 抽象方法的语法与接口方
法相似。 两者都是定义方法签名但不包含方法体。 然而，抽象方法必须包含 abstract 关
键字并且可以包含访问修饰符。

```ts
abstract class Department {
  constructor(public name: string) {}

  printName(): void {
    console.log('Department name: ' + this.name);
  }

  abstract printMeeting(): void; // 必须在派生类中实现
}

class AccountingDepartment extends Department {
  constructor() {
    super('Accounting and Auditing'); // 在派生类的构造函数中必须调用 super()
  }

  printMeeting(): void {
    console.log('The Accounting Department meets each Monday at 10am.');
  }

  generateReports(): void {
    console.log('Generating accounting reports...');
  }
}

let department: Department; // 允许创建一个对抽象类型的引用
department = new Department(); // 错误: 不能创建一个抽象类的实例
department = new AccountingDepartment(); // 允许对一个抽象子类进行实例化和赋值
department.printName();
department.printMeeting();
department.generateReports(); // 错误: 方法在声明的抽象类中不存在
```

### 高级技巧

#### 构造函数

#### 把类当做接口使用

```ts
class Point {
  x: number;
  y: number;
}

interface Point3d extends Point {
  z: number;
}

let point3d: Point3d = { x: 1, y: 2, z: 3 };
```
