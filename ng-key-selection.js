(function () {
    var _defaultOptions = {
        hoverClass: "key-hover",
        selectedClass: "selected",
        selectorClass: "selection-item",
        callbacks: {
            hover: angular.noop,
            select: angular.noop
        },
        preventDefault: true,
        scrollMargin: 5,
        scrollContainer: "document",
        keyActions: [ //use any and as many keys you want. available actions: "select", "up", "down"
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
                function KeySelectionPlugin(element, options) {
                    var _options = angular.extend({}, _defaultOptions, options), _self = this;
                    if (options && options.callbacks) {
                        _options.callbacks = angular.extend({}, _defaultOptions.callbacks, options.callbacks);
                    }
                    this._options = _options;
                    this._element = element;

                    this._keydownHandler = function (event) {
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

                    this._init();
                };

                KeySelectionPlugin.prototype._init = function () {
                    this._id = new Date().getTime() + Math.random().toString(36).substr(2);
                    var $scrollContainer =
                        this._options.scrollContainer === 'document'
                            ? $document
                            : angular.element($document[0].querySelector(this._options.scrollContainer));
                    $document.on('keydown', this._keydownHandler);
                    this.$scrollContainer = $scrollContainer;
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
                            top: rect.top + win.pageYOffset - docElem.clientTop,
                            left: rect.left + win.pageXOffset - docElem.clientLeft
                        };
                    }
                    return rect;
                };

                KeySelectionPlugin.prototype._getOuterHeight = function (element) {
                    var height = element.clientHeight;
                    var computedStyle = window.getComputedStyle(element);
                    height += parseInt(computedStyle.marginTop, 10);
                    height += parseInt(computedStyle.marginBottom, 10);
                    return height;
                };

                KeySelectionPlugin.prototype._scrollTo = function ($item) {
                    var itemOffsetTop = this._getOffset($item[0]).top;
                    var itemOuterHeight = this._getOuterHeight($item[0]);
                    var containerHeight = this._getOuterHeight(this.$scrollContainer[0]);
                    var containerTop = this._getOffset(this.$scrollContainer[0]).top;
                    var containerScrollTop = this.$scrollContainer[0].scrollTop;

                    var topOffset = containerTop - itemOffsetTop;
                    var bottomOffset = itemOffsetTop - (containerTop + containerHeight - itemOuterHeight);

                    if (topOffset > 0) { //元素在滚动条的上方遮盖住
                        this.$scrollContainer[0].scrollTop = containerScrollTop - topOffset - this._options.scrollMargin
                    } else if (bottomOffset > 0) { //元素在滚动条的下方遮盖住
                        this.$scrollContainer[0].scrollTop = containerScrollTop + bottomOffset + this._options.scrollMargin;
                    }
                };

                KeySelectionPlugin.prototype._switch = function (type) {
                    var $items = [], $keyHover = null, that = this;
                    angular.forEach(this._element.children(), function (item) {
                        var $item = angular.element(item);
                        if ($item.hasClass(that._options.selectorClass)) {
                            $items.push($item);
                        }
                        if ($item.hasClass(that._options.hoverClass)) {
                            $keyHover = $item;
                        }
                    });

                    var index = $items.indexOf($keyHover);
                    $keyHover && $keyHover.removeClass(this._options.hoverClass);
                    if (type === 'up') {
                        if (index > 0) {
                            $keyHover = $items[index - 1].addClass(this._options.hoverClass);
                        } else {
                            $keyHover = $items[$items.length - 1].addClass(this._options.hoverClass);
                        }
                    } else {
                        if ($items.length > index + 1) {
                            $keyHover = $items[index + 1].addClass(this._options.hoverClass);
                        } else {
                            $keyHover = $items[0].addClass(this._options.hoverClass);
                        }
                    }
                    this.$keyHover = $keyHover;
                    $timeout(function () {
                        this._options.callbacks.hover(event, $keyHover);
                    }.bind(this));
                    this._scrollTo($keyHover);
                };

                KeySelectionPlugin.prototype.up = function (event) {
                    this._switch('up', event);
                };

                KeySelectionPlugin.prototype.down = function (event) {
                    this._switch('down', event);
                };

                KeySelectionPlugin.prototype.select = function (event) {
                    $timeout(function () {
                        this._options.callbacks.select(event, this.$keyHover);
                    }.bind(this));
                    this.$keyHover.addClass(this._options.selectedClass);
                };

                KeySelectionPlugin.prototype.destroy = function () {
                    $document.off('keydown', this._keydownHandler);
                };

                return KeySelectionPlugin;
            }])
        .directive('keySelection', [
            'KeySelectionPlugin',
            function (KeySelectionPlugin) {
                return {
                    restrict: 'A',
                    link: function (scope, element, attrs) {
                        var options = scope.$eval(attrs.keySelection);
                        var selection = new KeySelectionPlugin(element, options);

                        scope.$on("$destroy", function () {
                            selection.destroy();
                            delete selection;
                        })
                    }
                }
            }]);
})();