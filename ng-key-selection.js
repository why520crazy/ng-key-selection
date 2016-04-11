(function () {
    var _defaultOptions = {
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
        globalKey      : false,//是否是全局事件，如果为false,则会在scrollContainer绑定keydown事件，否则会在document上绑定
        keyActions     : [ //use any and as many keys you want. available actions: "select", "up", "down"
            {keyCode: 13, action: "select"}, //enter
            {keyCode: 38, action: "up"}, //up
            {keyCode: 40, action: "down"}, //down
            {keyCode: 37, action: "up"}, //left
            {keyCode: 39, action: "down"} //right
        ]
    };

    function getWindow(elem) {
        return ( elem != null && elem === elem.window) ? elem : elem.nodeType === 9 && elem.defaultView;
    }

    angular.module('ng-key-selection', [])
        .factory("KeySelectionPlugin", [
            '$document',
            '$timeout',
            function ($document, $timeout) {
                var proto = Element.prototype;
                var vendor = proto.matches
                    || proto.matchesSelector
                    || proto.webkitMatchesSelector
                    || proto.mozMatchesSelector
                    || proto.msMatchesSelector
                    || proto.oMatchesSelector;

                /**
                 * Match `el` to `selector`.
                 *
                 * @param {Element} el
                 * @param {String} selector
                 * @return {Boolean}
                 * @api public
                 */

                function match(el, selector) {
                    if (vendor) return vendor.call(el, selector);
                    var nodes = el.parentNode.querySelectorAll(selector);
                    for (var i = 0; i < nodes.length; i++) {
                        if (nodes[i] == el) return true;
                    }
                    return false;
                }

                function KeySelectionPlugin(element, options) {
                    var _options = angular.extend({}, _defaultOptions, options);
                    if (options && options.callbacks) {
                        _options.callbacks = angular.extend({}, _defaultOptions.callbacks, options.callbacks);
                    }
                    this._options = _options;
                    this._$element = element;

                    this._init();
                };

                KeySelectionPlugin.prototype._init = function () {
                    //this._id = new Date().getTime() + Math.random().toString(36).substr(2);
                    var _self = this;

                    var scrollContainer =
                        this._options.scrollContainer === 'body'
                            ? $document[0]
                            : $document[0].querySelector(this._options.scrollContainer);

                    this._keydownHandler = function (event) {

                        if (!_self._options.callbacks.beforeHover(event)) {
                            return;
                        }
                        var noPropagation = false;
                        var keyCode = event.which || event.keyCode;
                        angular.forEach(_self._options.keyActions, function (keyAction) {
                            if (keyAction.keyCode === keyCode) {
                                switch (keyAction.action) {
                                    case "up":
                                        _self.up(event);
                                        noPropagation = true;
                                        break;
                                    case "down":
                                        _self.down(event);
                                        noPropagation = true;
                                        break;
                                    case "select":
                                        _self.select(event);
                                        noPropagation = true;
                                        break;
                                }
                                return false; //break out of each
                            }
                        });

                        if (noPropagation) {
                            event.stopPropagation();
                            _self._options.preventDefault && event.preventDefault();
                        }
                    };

                    (this._options.globalKey ? $document : angular.element(scrollContainer))
                        .on('keydown', this._keydownHandler);
                    this.scrollContainer = scrollContainer;
                };

                KeySelectionPlugin.prototype._getOffset = function (elem) {

                    var docElem, win, rect, doc;

                    if (!elem) {
                        return;
                    }
                    // Support: IE<=11+
                    // Running getBoundingClientRect on a
                    // disconnected node in IE throws an error
                    if (!elem.getClientRects().length) {
                        return {top: 0, left: 0};
                    }
                    rect = elem.getBoundingClientRect();

                    // Make sure element is not hidden (display: none)
                    if (rect.width || rect.height) {
                        doc = elem.ownerDocument;
                        win = getWindow(doc);
                        docElem = doc.documentElement;

                        return {
                            top : rect.top + win.pageYOffset - docElem.clientTop,
                            left: rect.left + win.pageXOffset - docElem.clientLeft
                        };
                    }
                    return rect;
                };

                KeySelectionPlugin.prototype._getOuterHeight = function (element) {
                    var _element = element.documentElement ? element.documentElement : element;
                    var height = _element.clientHeight;
                    var computedStyle = window.getComputedStyle(_element);
                    height += parseInt(computedStyle.marginTop, 10);
                    height += parseInt(computedStyle.marginBottom, 10);
                    return height;
                };

                KeySelectionPlugin.prototype._scrollTo = function (item) {
                    var scrollContainer = this.scrollContainer.body ? this.scrollContainer.body : this.scrollContainer;
                    var itemOffsetTop = this._getOffset(item).top;
                    var itemOuterHeight = this._getOuterHeight(item);
                    var containerHeight = this._getOuterHeight(this.scrollContainer);
                    var containerTop = this._getOffset(scrollContainer).top;
                    var containerScrollTop = scrollContainer.scrollTop;

                    var topOffset = containerTop - itemOffsetTop;
                    var bottomOffset = itemOffsetTop - (containerTop + containerHeight - itemOuterHeight);

                    if (topOffset > 0) { //元素在滚动条的上方遮盖住
                        scrollContainer.scrollTop = containerScrollTop - topOffset - this._options.scrollMargin
                    } else if (bottomOffset > 0) { //元素在滚动条的下方遮盖住
                        scrollContainer.scrollTop = containerScrollTop + bottomOffset + this._options.scrollMargin;
                    }
                };

                KeySelectionPlugin.prototype._getAllItems = function () {
                    var items = [], that = this;
                    angular.forEach(this._$element.children(), function (item) {
                        if (!that._options.filterSelector || !match(item, that._options.filterSelector)) {
                            if (!that._options.itemSelector || match(item, that._options.itemSelector)) {
                                items.push(item);
                            }
                        }
                    });
                    return items;
                };

                KeySelectionPlugin.prototype._getFirstItem = function () {
                    var firstItem = null, that = this;
                    angular.forEach(this._$element.children(), function (item) {
                        if (firstItem) {
                            return firstItem;
                        } else if (!that._options.filterSelector || !match(item, that._options.filterSelector)) {
                            if (!that._options.itemSelector || match(item, that._options.itemSelector)) {
                                firstItem = item;
                            }
                        }
                    });
                    return firstItem;
                };

                KeySelectionPlugin.prototype._switch = function (type, event) {
                    var items = this._getAllItems();
                    if (items.length <= 0) {
                        return;
                    }
                    //如果keyHover没有,找到样式为 hoverClass 的元素
                    if (!this.keyHover && this._options.itemSelector) {
                        this.keyHover = this._$element[0].querySelector("." + this._options.hoverClass);
                    }
                    var index = items.indexOf(this.keyHover);
                    var newHoverElement = null;
                    if (type === 'up') {
                        newHoverElement = index > 0 ? items[index - 1] : items[items.length - 1];
                    } else {
                        newHoverElement = items.length > index + 1 ? items[index + 1] : items[0];
                    }
                    this.hover(newHoverElement, event);
                };

                KeySelectionPlugin.prototype.up = function (event) {
                    this._switch('up', event);
                };

                KeySelectionPlugin.prototype.down = function (event) {
                    this._switch('down', event);
                };

                KeySelectionPlugin.prototype.hover = function (element, event) {
                    var _toFirst = false;
                    if (element === 'first') {
                        _toFirst = true;
                        var element = this._getFirstItem();
                        if (!element) {
                            return;
                        }
                    }
                    if (!element) {
                        return;
                    }
                    this.keyHover && angular.element(this.keyHover).removeClass(this._options.hoverClass);
                    this.keyHover = element;
                    var $keyHover = angular.element(this.keyHover);
                    $keyHover.addClass(this._options.hoverClass);
                    $timeout(function () {
                        this._options.callbacks.hover(event, this.keyHover);
                    }.bind(this));
                    !_toFirst && this._scrollTo(this.keyHover);
                };

                KeySelectionPlugin.prototype.select = function (event) {
                    $timeout(function () {
                        this._options.callbacks.select(event, this.keyHover);
                    }.bind(this));
                    this.keyHover && angular.element(this.keyHover).addClass(this._options.selectedClass);
                };

                KeySelectionPlugin.prototype.destroy = function () {
                    $document.off('keydown', this._keydownHandler);
                };

                return KeySelectionPlugin;
            }])
        .directive('keySelection', [
            'KeySelectionPlugin',
            '$parse',
            function (KeySelectionPlugin, $parse) {
                return {
                    restrict: 'A',
                    link    : function (scope, element, attrs) {
                        var options = scope.$eval(attrs.keySelection);
                        var selection = new KeySelectionPlugin(element, options);
                        if (attrs.selectionRef) {
                            $parse(attrs.selectionRef).assign(scope, selection);
                        }
                        scope.$on("$destroy", function () {
                            selection.destroy();
                            delete selection;
                        })
                    }
                }
            }]);
})();