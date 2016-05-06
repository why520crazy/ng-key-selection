# ng-key-selection
ng-key-selection is a lightweight angular plugin without jQuery for cycling through arbitrary element collections with arrow keys. 
Collection members are selectable by keyboard or mouse.

键盘按下（up、down或者left、right） 选择元素，并自动滚动到相关位置的插件

## demo & download

`bower install ng-key-selection`
          
see [demo](http://why520crazy.github.io/ng-key-selection)
          
## basic usage

```html
<div class="container" ng-controller="demoCtrl as demo">
    <ul key-selection="demo.keySelectionOptions">
        <li class="selection-item" ng-repeat="item in demo.items track by $index">
            {{item}}
        </li>
    </ul>
</div>
```

```js
 vm.keySelectionOptions = {
     scrollContainer: '.container',
     callbacks: {
          hover: function (e, $item) {
                console.log("hover:" + $item[0].innerHTML);
          },
          select: function (e, $item) {
               console.log("select:" + $item[0].innerHTML);
          }
     }
};
```


## default options

```js
   {
        hoverClass     : "key-hover",
        selectedClass  : "selected",
        itemSelector   : ".selection-item",
        filterSelector : ".ng-hide",
        callbacks      : {
            beforeHover: function () {
                return true;
            },
            hover      : angular.noop,
            select     : angular.noop
        },
        preventDefault : true,
        scrollMargin   : 5,
        scrollContainer: "body",
        eventContainer : "",//事件绑定的区域,当globalKey设置为false时起作用,默认为scrollContainer
        globalKey      : false,//是否是全局事件，如果为false,则会在scrollContainer绑定keydown事件，否则会在document上绑定
        keyActions     : [ //use any and as many keys you want. available actions: "select", "up", "down"
            {keyCode: 13, action: "select"}, //enter
            {keyCode: 38, action: "up"}, //up
            {keyCode: 40, action: "down"}, //down
            {keyCode: 37, action: "up"}, //left
            {keyCode: 39, action: "down"} //right
        ]
    }
```
