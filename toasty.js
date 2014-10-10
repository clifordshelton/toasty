/*
TOASTY JQUERY PLUGIN
Version: 1.0
Date: Oct 7, 2013
Author: Cliford Shelton
Contact: clifordshelton@gmail.com
*/
(function( $ ) {
    var defaults = {
        /* ---- Configurations ---- */
        message: "",
        title: "",
        autoHide: 0,
        modal: false,
        position: "br",
        closeable: true,
        anim: "slide",
        easing: "swing",
        showAnim: null,
        showAnimEasing: "easeOutBack",
        showSpeed: 300,
        hideAnim: "slide fade",
        hideAnimEasing: null,
        hideSpeed: 200
    },
    handles = {},
    msgIndex = 0,
    activeMsgs = {},
    activeMsgOrder = [],
    modalCount = 0,
    initialized = false;

    $.fn.toasty = function(actionOrParams, params) {
        var temp;

        if (actionOrParams === "hide") {
            hideToast(params);
        } else if (actionOrParams === "hideAll") {
            for (toast in activeMsgs) {
                temp = {
                    msgID: activeMsgs[toast].msgID
                };
                if (params != undefined) {
                    $().extend(temp, params);
                }
                hideToast(temp);
            }
        } else if (actionOrParams === "getDefaults") {
            return defaults;
        } else if (actionOrParams === "setDefaults") {
            $().extend(defaults, params);
        } else if (actionOrParams === "show") {
            if (params.message != undefined && params.message != null) {
                return showToast(params);
            }
        } else if (actionOrParams != undefined && actionOrParams != null) {
            if (typeof actionOrParams == "object" && actionOrParams.constructor != Array) {
                if (actionOrParams.message != undefined && actionOrParams.message != null) {
                    return showToast(actionOrParams);
                }
            } else {
                return showToast({ message: actionOrParams });
            }
        }
    };

    function showToast(params) {
        try{
            var item = {
                /* ---- Events ---- */
                beforeShow: null,
                afterShow: null,
                beforeHide: null,
                afterHide: null,
                afterDestroy: null,

                /* ---- Internal ---- */
                msgHeight: null,
                msgID: null,
                animHandle: null,
                timerHandle: null,
                showing: false,
                hiding: false
            },
            toast,
            toastCloseBtn,
            toastMessage,
            msgElem,
            toastHead;

            if (!initialized) {
                init();
            }

            $().extend(item, defaults);
            $().extend(item, params);

            msgIndex++;
            item.msgID = msgIndex;

            toast = $("<div></div>", {
                "class": 'toasty_toastMsg'
            });
            if (item.closeable || item.title != "" || item.autoHide) {
                toastHead = $("<div></div>",{
                    "class": 'toasty_head'
                });
                if (item.autoHide && !isNaN(item.autoHide)) {
                    $("<div></div>",{
                        "class": 'toasty_autoHideTimer'
                    }).appendTo(toastHead);
                }
                if (item.closeable) {
                    $("<div></div>",{
                        "class": 'toasty_closeBtn',
                        html: 'x'
                    }).on('click',function(eventHandle){
                        hideToast(item, eventHandle);
                    }).appendTo(toastHead);
                }
                if (item.title != "") {
                    $("<div></div>",{
                        "class": 'toasty_title',
                        html: item.title
                    }).appendTo(toastHead);
                }
                toastHead.appendTo(toast);
            }
            toastMessage = $("<div></div>",{
                "class": 'toasty_message',
                html: typeof item.message == "object"? (item.message.constructor == Array? "[Array]" :"[Object]") : item.message
            });
            toastMessage.find(".closeToast").on("click", function(eventHandle){
                hideToast(item, eventHandle);
            });
            toast.append(toastMessage);

            handles.measurebox.append(toast);
            item.msgHeight = handles.measurebox.height();

            toastHolder = $("<div></div>", {
                "class": 'toasty_toastHolder',
                id: 'toast_' + item.msgID
            });

            handles.measurebox.find(".toasty_toastMsg").appendTo(toastHolder);
            if (item.position == "tl" || item.position == "tr" || item.position == "tc") {
                handles["container_" + item.position].prepend(toastHolder);
            } else {
                toastHolder.appendTo(handles["container_" + item.position]);
            }

            item.toast = toastHolder;

            if (item.showAnim == null || item.showAnim == "") {
                item.showAnim = item.anim;
            }
            if (item.showAnimEasing == null || item.showAnimEasing == "") {
                item.showAnimEasing = item.easing;
            }
            if (item.hideAnim == null || item.hideAnim == "") {
                item.hideAnim = item.anim;
            }
            if (item.hideAnimEasing == null || item.hideAnimEasing == "") {
                item.hideAnimEasing = item.easing;
            }

            if (animateToast(item, true)){
                activeMsgs[item.msgID] = item;
                activeMsgOrder.push(item.msgID);
                if (activeMsgOrder.length == 1) {
                    $(document).keydown(handleEscapeKey);
                }
                if (item.autoHide && !isNaN(item.autoHide)) {
                    item.timerHandle = setTimeout(function(){
                        item.timerHandle = null;
                        animateToast(item, false);
                    }, parseInt(item.autoHide));
                    item.toast.find('.toasty_autoHideTimer').animate({
                        width: "0%"
                    }, parseInt(item.autoHide));
                }
                return item;
            } else {
                return false;
            }
        } catch(ex) {
            throw ex;
        }
    }

    function hideToast(item, eventHandle) {
        var activeItem;

        if (activeMsgs[item.msgID]) {
            activeItem = activeMsgs[item.msgID];
            if (!activeItem.hiding && activeItem.toast != null) {
                $().extend(activeItem, item);
                animateToast(activeItem, false, eventHandle);
            }
        }
    }

    function animateToast(item, show, eventHandle) {
        var animations = (show? item.showAnim : item.hideAnim).split(" "),
            animParam = {},
            i,
            maxI,
            duration = show? parseInt(item.showSpeed) : parseInt(item.hideSpeed),
            beforeResponse = true,
            easing = "linear",
            atLeastOneSlide = false;

        for (i = 0, maxI = animations.length; i < maxI; i++) {
            if (animations[i] == "slide") {
                if (show) {
                    item.toast.height("0px");
                    animParam.height = item.msgHeight + "px";
                    easing = item.showAnimEasing;
                    atLeastOneSlide = true;
                } else {
                    //item.toast.height(item.msgHeight + "px");
                    animParam.height = "0px";
                    easing = item.hideAnimEasing;
                }
            } else if (animations[i] == "fade") {
                if (show) {
                    item.toast.css("opacity", 0);
                    animParam.opacity = 1;
                } else {
                    //item.toast.css("opacity", 1);
                    animParam.opacity = 0;
                }
            }
            if (show && !atLeastOneSlide) {
                item.toast.height(item.msgHeight + "px");
            }
        }
        try{
            if (show) {
                if (item.beforeShow != null) {
                    try{ beforeResponse = item.beforeShow(item); }catch(ex){}
                }
            } else {
                if (item.beforeHide != null) {
                    try{ beforeResponse = item.beforeHide(item, eventHandle); }catch(ex){}
                }
            }
        } catch(ex) {}

        if (beforeResponse != false) {
            beforeResponse = true;
            if (item.timerHandle) {
                clearTimeout(item.timerHandle); 
            }

            if (item.modal) {
                if (show) {
                    modalCount++;
                    if (modalCount == 1) {
                        handles.mask.stop(true,false).css("opacity", 0).show().animate({
                            opacity: 0.5
                        }, item.showSpeed);
                    }
                } else {
                    modalCount--;
                    if (modalCount == 0) {
                        handles.mask.stop(true,false).animate({
                            opacity: 0
                        }, item.hideSpeed, function() {
                            handles.mask.hide();
                        });
                    }
                }
            }

            if (item.showing || item.hiding) {
                item.toast.stop(true, false);
            }
            if (show) {
                item.showing = true;
            } else {
                item.hiding = true;
            }
            item.hide = function () {
                hideToast(item);
            }
            item.animHandle = item.toast.animate(animParam, duration, easing, function () {
                var i;

                item.animHandle = null;
                if (show) {
                    item.showing = false;

                    if (item.afterShow != null) {
                        try{ item.afterShow(item); }catch(ex){}
                    }
                } else {
                    item.hiding = false;

                    if (item.afterHide != null) {
                        try{ item.afterHide(item, eventHandle); }catch(ex){}
                    }
                    item.toast.remove();
                    item.toast = null;

                    activeMsgOrder.splice($.inArray(item.msgID, activeMsgOrder), 1);
                    if (activeMsgOrder.length == 0) {
                        $(document).unbind("keydown", handleEscapeKey);
                    }
                    delete activeMsgs[item.msgID];
                    if (item.afterDestroy != null) {
                        try{ item.afterDestroy(item, eventHandle); }catch(ex){}
                    }
                }
            });
        }
        return beforeResponse;
    }

    /* -- Method to create mask and message place holders -- */
    function init(){
        var temp = document.createElement("div"),
            body = $("body"),
            /* itemsToAdd array contains the list of elements to be inserted
                  field - The key under which a reference to DOM element will be stored in internal handles object
                  id - Actual id of the element
                  cssClass - The CSS style class which will be applied
                  container - The generated item will be appended to what is specified as the container */
            itemsToAdd = [
                { field: "mask", id: "msgMask", cssClass: "toasty_msgMask", container: body },
                { field: "measurebox", id: "msgMeasureBox", cssClass: "toasty_msgMeasureBox", container: body },
                { field: "container_br", id: "container_br", cssClass: "toasty_msgContainer br", container: body },
                { field: "container_bl", id: "container_bl", cssClass: "toasty_msgContainer bl", container: body },
                { field: "container_tr", id: "container_tr", cssClass: "toasty_msgContainer tr", container: body },
                { field: "container_tl", id: "container_tl", cssClass: "toasty_msgContainer tl", container: body },
                { field: "tc_holder", id: "tc_holder", cssClass: "toasty_msgContainer tc", container: body },
                { field: "container_tc", id: "container_tc", cssClass: "toasty_subContainer", container: "#tc_holder" },
                { field: "bc_holder", id: "bc_holder", cssClass: "toasty_msgContainer bc", container: body },
                { field: "container_bc", id: "container_bc", cssClass: "toasty_subContainer", container: "#bc_holder" }
            ],
            i,
            maxI,
            item,
            domSearch;

        for(i = 0, maxI = itemsToAdd.length; i < maxI; i++) {
            item = itemsToAdd[i];
            domSearch = $("#"+item.id);
            if (domSearch.length > 0) {
                handles[item.field] = domSearch;
            } else {
                handles[item.field] = $("<div id='" + item.id + "' class='" + item.cssClass + "'></div>").appendTo(item.container);
            }
        }

        initialized = true;
    }

    function handleEscapeKey(e){
        var i,
            maxI;

        if (e.keyCode == 27) {
            for (i = 0, maxI = activeMsgOrder.length; i < maxI; i++) {
                if (activeMsgs[activeMsgOrder[i]].closeable && activeMsgs[activeMsgOrder[i]].hiding == false) {
                    hideToast(activeMsgs[activeMsgOrder[i]], e);
                    break;
                }
            }
        }
    }
}( jQuery ));

/* -- Adding easings to jQuery if they do not exist --*/
(function( $ ) {
    var easings = {
        easeInExpo: function (x, t, b, c, d) {
            return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
        },
        easeOutExpo: function (x, t, b, c, d) {
            return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
        },
        easeInOutExpo: function (x, t, b, c, d) {
            if (t==0) return b;
            if (t==d) return b+c;
            if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
            return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
        },
        easeInCirc: function (x, t, b, c, d) {
            return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
        },
        easeOutCirc: function (x, t, b, c, d) {
            return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
        },
        easeInOutCirc: function (x, t, b, c, d) {
            if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
            return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
        },
        easeInElastic: function (x, t, b, c, d) {
            var s=1.70158;var p=0;var a=c;
            if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
            if (a < Math.abs(c)) { a=c; var s=p/4; }
            else var s = p/(2*Math.PI) * Math.asin (c/a);
            return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
        },
        easeOutElastic: function (x, t, b, c, d) {
            var s=1.70158;var p=0;var a=c;
            if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
            if (a < Math.abs(c)) { a=c; var s=p/4; }
            else var s = p/(2*Math.PI) * Math.asin (c/a);
            return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
        },
        easeInOutElastic: function (x, t, b, c, d) {
            var s=1.70158;var p=0;var a=c;
            if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
            if (a < Math.abs(c)) { a=c; var s=p/4; }
            else var s = p/(2*Math.PI) * Math.asin (c/a);
            if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
            return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
        },
        easeInBack: function (x, t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            return c*(t/=d)*t*((s+1)*t - s) + b;
        },
        easeOutBack: function (x, t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
        },
        easeInOutBack: function (x, t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
            return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
        },
        easeInBounce: function (x, t, b, c, d) {
            return c - $.easing.easeOutBounce (x, d-t, 0, c, d) + b;
        },
        easeOutBounce: function (x, t, b, c, d) {
            if ((t/=d) < (1/2.75)) {
                return c*(7.5625*t*t) + b;
            } else if (t < (2/2.75)) {
                return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
            } else if (t < (2.5/2.75)) {
                return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
            } else {
                return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
            }
        },
        easeInOutBounce: function (x, t, b, c, d) {
            if (t < d/2) return $.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
            return $.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
        }
    },
    key;

    for(key in easings) {
        if ($.easing[key] == undefined) {
            $.easing[key] = easings[key];
        }
    }
}( jQuery ));
