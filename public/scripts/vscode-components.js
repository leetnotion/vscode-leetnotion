var j=function(){if(typeof globalThis<"u")return globalThis;if(typeof global<"u")return global;if(typeof self<"u")return self;if(typeof window<"u")return window;try{return new Function("return this")()}catch{return{}}}();j.trustedTypes===void 0&&(j.trustedTypes={createPolicy:(r,t)=>t});var nr={configurable:!1,enumerable:!1,writable:!1};j.FAST===void 0&&Reflect.defineProperty(j,"FAST",Object.assign({value:Object.create(null)},nr));var X=j.FAST;if(X.getById===void 0){let r=Object.create(null);Reflect.defineProperty(X,"getById",Object.assign({value(t,e){let o=r[t];return o===void 0&&(o=e?r[t]=e():null),o}},nr))}var z=Object.freeze([]);function Ft(){let r=new WeakMap;return function(t){let e=r.get(t);if(e===void 0){let o=Reflect.getPrototypeOf(t);for(;e===void 0&&o!==null;)e=r.get(o),o=Reflect.getPrototypeOf(o);e=e===void 0?[]:e.slice(0),r.set(t,e)}return e}}var le=j.FAST.getById(1,()=>{let r=[],t=[];function e(){if(t.length)throw t.shift()}function o(s){try{s.call()}catch(a){t.push(a),setTimeout(e,0)}}function n(){let a=0;for(;a<r.length;)if(o(r[a]),a++,a>1024){for(let u=0,l=r.length-a;u<l;u++)r[u]=r[u+a];r.length-=a,a=0}r.length=0}function i(s){r.length<1&&j.requestAnimationFrame(n),r.push(s)}return Object.freeze({enqueue:i,process:n})}),ir=j.trustedTypes.createPolicy("fast-html",{createHTML:r=>r}),ce=ir,wt=`fast-${Math.random().toString(36).substring(2,8)}`,ue=`${wt}{`,It=`}${wt}`,p=Object.freeze({supportsAdoptedStyleSheets:Array.isArray(document.adoptedStyleSheets)&&"replace"in CSSStyleSheet.prototype,setHTMLPolicy(r){if(ce!==ir)throw new Error("The HTML policy can only be set once.");ce=r},createHTML(r){return ce.createHTML(r)},isMarker(r){return r&&r.nodeType===8&&r.data.startsWith(wt)},extractDirectiveIndexFromMarker(r){return parseInt(r.data.replace(`${wt}:`,""))},createInterpolationPlaceholder(r){return`${ue}${r}${It}`},createCustomAttributePlaceholder(r,t){return`${r}="${this.createInterpolationPlaceholder(t)}"`},createBlockPlaceholder(r){return`<!--${wt}:${r}-->`},queueUpdate:le.enqueue,processUpdates:le.process,nextUpdate(){return new Promise(le.enqueue)},setAttribute(r,t,e){e==null?r.removeAttribute(t):r.setAttribute(t,e)},setBooleanAttribute(r,t,e){e?r.setAttribute(t,""):r.removeAttribute(t)},removeChildNodes(r){for(let t=r.firstChild;t!==null;t=r.firstChild)r.removeChild(t)},createTemplateWalker(r){return document.createTreeWalker(r,133,null,!1)}});var at=class{constructor(t,e){this.sub1=void 0,this.sub2=void 0,this.spillover=void 0,this.source=t,this.sub1=e}has(t){return this.spillover===void 0?this.sub1===t||this.sub2===t:this.spillover.indexOf(t)!==-1}subscribe(t){let e=this.spillover;if(e===void 0){if(this.has(t))return;if(this.sub1===void 0){this.sub1=t;return}if(this.sub2===void 0){this.sub2=t;return}this.spillover=[this.sub1,this.sub2,t],this.sub1=void 0,this.sub2=void 0}else e.indexOf(t)===-1&&e.push(t)}unsubscribe(t){let e=this.spillover;if(e===void 0)this.sub1===t?this.sub1=void 0:this.sub2===t&&(this.sub2=void 0);else{let o=e.indexOf(t);o!==-1&&e.splice(o,1)}}notify(t){let e=this.spillover,o=this.source;if(e===void 0){let n=this.sub1,i=this.sub2;n!==void 0&&n.handleChange(o,t),i!==void 0&&i.handleChange(o,t)}else for(let n=0,i=e.length;n<i;++n)e[n].handleChange(o,t)}},lt=class{constructor(t){this.subscribers={},this.sourceSubscribers=null,this.source=t}notify(t){var e;let o=this.subscribers[t];o!==void 0&&o.notify(t),(e=this.sourceSubscribers)===null||e===void 0||e.notify(t)}subscribe(t,e){var o;if(e){let n=this.subscribers[e];n===void 0&&(this.subscribers[e]=n=new at(this.source)),n.subscribe(t)}else this.sourceSubscribers=(o=this.sourceSubscribers)!==null&&o!==void 0?o:new at(this.source),this.sourceSubscribers.subscribe(t)}unsubscribe(t,e){var o;if(e){let n=this.subscribers[e];n!==void 0&&n.unsubscribe(t)}else(o=this.sourceSubscribers)===null||o===void 0||o.unsubscribe(t)}};var g=X.getById(2,()=>{let r=/(:|&&|\|\||if)/,t=new WeakMap,e=p.queueUpdate,o,n=l=>{throw new Error("Must call enableArrayObservation before observing arrays.")};function i(l){let f=l.$fastController||t.get(l);return f===void 0&&(Array.isArray(l)?f=n(l):t.set(l,f=new lt(l))),f}let s=Ft();class a{constructor(f){this.name=f,this.field=`_${f}`,this.callback=`${f}Changed`}getValue(f){return o!==void 0&&o.watch(f,this.name),f[this.field]}setValue(f,m){let w=this.field,M=f[w];if(M!==m){f[w]=m;let C=f[this.callback];typeof C=="function"&&C.call(f,M,m),i(f).notify(this.name)}}}class u extends at{constructor(f,m,w=!1){super(f,m),this.binding=f,this.isVolatileBinding=w,this.needsRefresh=!0,this.needsQueue=!0,this.first=this,this.last=null,this.propertySource=void 0,this.propertyName=void 0,this.notifier=void 0,this.next=void 0}observe(f,m){this.needsRefresh&&this.last!==null&&this.disconnect();let w=o;o=this.needsRefresh?this:void 0,this.needsRefresh=this.isVolatileBinding;let M=this.binding(f,m);return o=w,M}disconnect(){if(this.last!==null){let f=this.first;for(;f!==void 0;)f.notifier.unsubscribe(this,f.propertyName),f=f.next;this.last=null,this.needsRefresh=this.needsQueue=!0}}watch(f,m){let w=this.last,M=i(f),C=w===null?this.first:{};if(C.propertySource=f,C.propertyName=m,C.notifier=M,M.subscribe(this,m),w!==null){if(!this.needsRefresh){let A;o=void 0,A=w.propertySource[w.propertyName],o=this,f===A&&(this.needsRefresh=!0)}w.next=C}this.last=C}handleChange(){this.needsQueue&&(this.needsQueue=!1,e(this))}call(){this.last!==null&&(this.needsQueue=!0,this.notify(this))}records(){let f=this.first;return{next:()=>{let m=f;return m===void 0?{value:void 0,done:!0}:(f=f.next,{value:m,done:!1})},[Symbol.iterator]:function(){return this}}}}return Object.freeze({setArrayObserverFactory(l){n=l},getNotifier:i,track(l,f){o!==void 0&&o.watch(l,f)},trackVolatile(){o!==void 0&&(o.needsRefresh=!0)},notify(l,f){i(l).notify(f)},defineProperty(l,f){typeof f=="string"&&(f=new a(f)),s(l).push(f),Reflect.defineProperty(l,f.name,{enumerable:!0,get:function(){return f.getValue(this)},set:function(m){f.setValue(this,m)}})},getAccessors:s,binding(l,f,m=this.isVolatileBinding(l)){return new u(l,f,m)},isVolatileBinding(l){return r.test(l.toString())}})});function x(r,t){g.defineProperty(r,t)}var sr=X.getById(3,()=>{let r=null;return{get(){return r},set(t){r=t}}}),q=class{constructor(){this.index=0,this.length=0,this.parent=null,this.parentContext=null}get event(){return sr.get()}get isEven(){return this.index%2===0}get isOdd(){return this.index%2!==0}get isFirst(){return this.index===0}get isInMiddle(){return!this.isFirst&&!this.isLast}get isLast(){return this.index===this.length-1}static setEvent(t){sr.set(t)}};g.defineProperty(q.prototype,"index");g.defineProperty(q.prototype,"length");var U=Object.seal(new q);var ct=class{constructor(){this.targetIndex=0}},ut=class extends ct{constructor(){super(...arguments),this.createPlaceholder=p.createInterpolationPlaceholder}},dt=class extends ct{constructor(t,e,o){super(),this.name=t,this.behavior=e,this.options=o}createPlaceholder(t){return p.createCustomAttributePlaceholder(this.name,t)}createBehavior(t){return new this.behavior(t,this.options)}};function xo(r,t){this.source=r,this.context=t,this.bindingObserver===null&&(this.bindingObserver=g.binding(this.binding,this,this.isBindingVolatile)),this.updateTarget(this.bindingObserver.observe(r,t))}function wo(r,t){this.source=r,this.context=t,this.target.addEventListener(this.targetName,this)}function ko(){this.bindingObserver.disconnect(),this.source=null,this.context=null}function Co(){this.bindingObserver.disconnect(),this.source=null,this.context=null;let r=this.target.$fastView;r!==void 0&&r.isComposed&&(r.unbind(),r.needsBindOnly=!0)}function So(){this.target.removeEventListener(this.targetName,this),this.source=null,this.context=null}function $o(r){p.setAttribute(this.target,this.targetName,r)}function To(r){p.setBooleanAttribute(this.target,this.targetName,r)}function Po(r){if(r==null&&(r=""),r.create){this.target.textContent="";let t=this.target.$fastView;t===void 0?t=r.create():this.target.$fastTemplate!==r&&(t.isComposed&&(t.remove(),t.unbind()),t=r.create()),t.isComposed?t.needsBindOnly&&(t.needsBindOnly=!1,t.bind(this.source,this.context)):(t.isComposed=!0,t.bind(this.source,this.context),t.insertBefore(this.target),this.target.$fastView=t,this.target.$fastTemplate=r)}else{let t=this.target.$fastView;t!==void 0&&t.isComposed&&(t.isComposed=!1,t.remove(),t.needsBindOnly?t.needsBindOnly=!1:t.unbind()),this.target.textContent=r}}function Oo(r){this.target[this.targetName]=r}function Ro(r){let t=this.classVersions||Object.create(null),e=this.target,o=this.version||0;if(r!=null&&r.length){let n=r.split(/\s+/);for(let i=0,s=n.length;i<s;++i){let a=n[i];a!==""&&(t[a]=o,e.classList.add(a))}}if(this.classVersions=t,this.version=o+1,o!==0){o-=1;for(let n in t)t[n]===o&&e.classList.remove(n)}}var Y=class extends ut{constructor(t){super(),this.binding=t,this.bind=xo,this.unbind=ko,this.updateTarget=$o,this.isBindingVolatile=g.isVolatileBinding(this.binding)}get targetName(){return this.originalTargetName}set targetName(t){if(this.originalTargetName=t,t!==void 0)switch(t[0]){case":":if(this.cleanedTargetName=t.substr(1),this.updateTarget=Oo,this.cleanedTargetName==="innerHTML"){let e=this.binding;this.binding=(o,n)=>p.createHTML(e(o,n))}break;case"?":this.cleanedTargetName=t.substr(1),this.updateTarget=To;break;case"@":this.cleanedTargetName=t.substr(1),this.bind=wo,this.unbind=So;break;default:this.cleanedTargetName=t,t==="class"&&(this.updateTarget=Ro);break}}targetAtContent(){this.updateTarget=Po,this.unbind=Co}createBehavior(t){return new de(t,this.binding,this.isBindingVolatile,this.bind,this.unbind,this.updateTarget,this.cleanedTargetName)}},de=class{constructor(t,e,o,n,i,s,a){this.source=null,this.context=null,this.bindingObserver=null,this.target=t,this.binding=e,this.isBindingVolatile=o,this.bind=n,this.unbind=i,this.updateTarget=s,this.targetName=a}handleChange(){this.updateTarget(this.bindingObserver.observe(this.source,this.context))}handleEvent(t){q.setEvent(t);let e=this.binding(this.source,this.context);q.setEvent(null),e!==!0&&t.preventDefault()}};var he=null,fe=class r{addFactory(t){t.targetIndex=this.targetIndex,this.behaviorFactories.push(t)}captureContentBinding(t){t.targetAtContent(),this.addFactory(t)}reset(){this.behaviorFactories=[],this.targetIndex=-1}release(){he=this}static borrow(t){let e=he||new r;return e.directives=t,e.reset(),he=null,e}};function Eo(r){if(r.length===1)return r[0];let t,e=r.length,o=r.map(s=>typeof s=="string"?()=>s:(t=s.targetName||t,s.binding)),n=(s,a)=>{let u="";for(let l=0;l<e;++l)u+=o[l](s,a);return u},i=new Y(n);return i.targetName=t,i}var Ao=It.length;function lr(r,t){let e=t.split(ue);if(e.length===1)return null;let o=[];for(let n=0,i=e.length;n<i;++n){let s=e[n],a=s.indexOf(It),u;if(a===-1)u=s;else{let l=parseInt(s.substring(0,a));o.push(r.directives[l]),u=s.substring(a+Ao)}u!==""&&o.push(u)}return o}function ar(r,t,e=!1){let o=t.attributes;for(let n=0,i=o.length;n<i;++n){let s=o[n],a=s.value,u=lr(r,a),l=null;u===null?e&&(l=new Y(()=>a),l.targetName=s.name):l=Eo(u),l!==null&&(t.removeAttributeNode(s),n--,i--,r.addFactory(l))}}function Do(r,t,e){let o=lr(r,t.textContent);if(o!==null){let n=t;for(let i=0,s=o.length;i<s;++i){let a=o[i],u=i===0?t:n.parentNode.insertBefore(document.createTextNode(""),n.nextSibling);typeof a=="string"?u.textContent=a:(u.textContent=" ",r.captureContentBinding(a)),n=u,r.targetIndex++,u!==t&&e.nextNode()}r.targetIndex--}}function cr(r,t){let e=r.content;document.adoptNode(e);let o=fe.borrow(t);ar(o,r,!0);let n=o.behaviorFactories;o.reset();let i=p.createTemplateWalker(e),s;for(;s=i.nextNode();)switch(o.targetIndex++,s.nodeType){case 1:ar(o,s);break;case 3:Do(o,s,i);break;case 8:p.isMarker(s)&&o.addFactory(t[p.extractDirectiveIndexFromMarker(s)])}let a=0;(p.isMarker(e.firstChild)||e.childNodes.length===1&&t.length)&&(e.insertBefore(document.createComment(""),e.firstChild),a=-1);let u=o.behaviorFactories;return o.release(),{fragment:e,viewBehaviorFactories:u,hostBehaviorFactories:n,targetOffset:a}}var pe=document.createRange(),Mt=class{constructor(t,e){this.fragment=t,this.behaviors=e,this.source=null,this.context=null,this.firstChild=t.firstChild,this.lastChild=t.lastChild}appendTo(t){t.appendChild(this.fragment)}insertBefore(t){if(this.fragment.hasChildNodes())t.parentNode.insertBefore(this.fragment,t);else{let e=this.lastChild;if(t.previousSibling===e)return;let o=t.parentNode,n=this.firstChild,i;for(;n!==e;)i=n.nextSibling,o.insertBefore(n,t),n=i;o.insertBefore(e,t)}}remove(){let t=this.fragment,e=this.lastChild,o=this.firstChild,n;for(;o!==e;)n=o.nextSibling,t.appendChild(o),o=n;t.appendChild(e)}dispose(){let t=this.firstChild.parentNode,e=this.lastChild,o=this.firstChild,n;for(;o!==e;)n=o.nextSibling,t.removeChild(o),o=n;t.removeChild(e);let i=this.behaviors,s=this.source;for(let a=0,u=i.length;a<u;++a)i[a].unbind(s)}bind(t,e){let o=this.behaviors;if(this.source!==t)if(this.source!==null){let n=this.source;this.source=t,this.context=e;for(let i=0,s=o.length;i<s;++i){let a=o[i];a.unbind(n),a.bind(t,e)}}else{this.source=t,this.context=e;for(let n=0,i=o.length;n<i;++n)o[n].bind(t,e)}}unbind(){if(this.source===null)return;let t=this.behaviors,e=this.source;for(let o=0,n=t.length;o<n;++o)t[o].unbind(e);this.source=null}static disposeContiguousBatch(t){if(t.length!==0){pe.setStartBefore(t[0].firstChild),pe.setEndAfter(t[t.length-1].lastChild),pe.deleteContents();for(let e=0,o=t.length;e<o;++e){let n=t[e],i=n.behaviors,s=n.source;for(let a=0,u=i.length;a<u;++a)i[a].unbind(s)}}}};var Lt=class{constructor(t,e){this.behaviorCount=0,this.hasHostBehaviors=!1,this.fragment=null,this.targetOffset=0,this.viewBehaviorFactories=null,this.hostBehaviorFactories=null,this.html=t,this.directives=e}create(t){if(this.fragment===null){let l,f=this.html;if(typeof f=="string"){l=document.createElement("template"),l.innerHTML=p.createHTML(f);let w=l.content.firstElementChild;w!==null&&w.tagName==="TEMPLATE"&&(l=w)}else l=f;let m=cr(l,this.directives);this.fragment=m.fragment,this.viewBehaviorFactories=m.viewBehaviorFactories,this.hostBehaviorFactories=m.hostBehaviorFactories,this.targetOffset=m.targetOffset,this.behaviorCount=this.viewBehaviorFactories.length+this.hostBehaviorFactories.length,this.hasHostBehaviors=this.hostBehaviorFactories.length>0}let e=this.fragment.cloneNode(!0),o=this.viewBehaviorFactories,n=new Array(this.behaviorCount),i=p.createTemplateWalker(e),s=0,a=this.targetOffset,u=i.nextNode();for(let l=o.length;s<l;++s){let f=o[s],m=f.targetIndex;for(;u!==null;)if(a===m){n[s]=f.createBehavior(u);break}else u=i.nextNode(),a++}if(this.hasHostBehaviors){let l=this.hostBehaviorFactories;for(let f=0,m=l.length;f<m;++f,++s)n[s]=l[f].createBehavior(t)}return new Mt(e,n)}render(t,e,o){typeof e=="string"&&(e=document.getElementById(e)),o===void 0&&(o=e);let n=this.create(o);return n.bind(t,U),n.appendTo(e),n}},_o=/([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;function D(r,...t){let e=[],o="";for(let n=0,i=r.length-1;n<i;++n){let s=r[n],a=t[n];if(o+=s,a instanceof Lt){let u=a;a=()=>u}if(typeof a=="function"&&(a=new Y(a)),a instanceof ut){let u=_o.exec(s);u!==null&&(a.targetName=u[2])}a instanceof ct?(o+=a.createPlaceholder(e.length),e.push(a)):o+=a}return o+=r[r.length-1],new Lt(o,e)}var v=class{constructor(){this.targets=new WeakSet}addStylesTo(t){this.targets.add(t)}removeStylesFrom(t){this.targets.delete(t)}isAttachedTo(t){return this.targets.has(t)}withBehaviors(...t){return this.behaviors=this.behaviors===null?t:this.behaviors.concat(t),this}};v.create=(()=>{if(p.supportsAdoptedStyleSheets){let r=new Map;return t=>new me(t,r)}return r=>new be(r)})();function ge(r){return r.map(t=>t instanceof v?ge(t.styles):[t]).reduce((t,e)=>t.concat(e),[])}function ur(r){return r.map(t=>t instanceof v?t.behaviors:null).reduce((t,e)=>e===null?t:(t===null&&(t=[]),t.concat(e)),null)}var dr=(r,t)=>{r.adoptedStyleSheets=[...r.adoptedStyleSheets,...t]},hr=(r,t)=>{r.adoptedStyleSheets=r.adoptedStyleSheets.filter(e=>t.indexOf(e)===-1)};if(p.supportsAdoptedStyleSheets)try{document.adoptedStyleSheets.push(),document.adoptedStyleSheets.splice(),dr=(r,t)=>{r.adoptedStyleSheets.push(...t)},hr=(r,t)=>{for(let e of t){let o=r.adoptedStyleSheets.indexOf(e);o!==-1&&r.adoptedStyleSheets.splice(o,1)}}}catch{}var me=class extends v{constructor(t,e){super(),this.styles=t,this.styleSheetCache=e,this._styleSheets=void 0,this.behaviors=ur(t)}get styleSheets(){if(this._styleSheets===void 0){let t=this.styles,e=this.styleSheetCache;this._styleSheets=ge(t).map(o=>{if(o instanceof CSSStyleSheet)return o;let n=e.get(o);return n===void 0&&(n=new CSSStyleSheet,n.replaceSync(o),e.set(o,n)),n})}return this._styleSheets}addStylesTo(t){dr(t,this.styleSheets),super.addStylesTo(t)}removeStylesFrom(t){hr(t,this.styleSheets),super.removeStylesFrom(t)}},Bo=0;function Fo(){return`fast-style-class-${++Bo}`}var be=class extends v{constructor(t){super(),this.styles=t,this.behaviors=null,this.behaviors=ur(t),this.styleSheets=ge(t),this.styleClass=Fo()}addStylesTo(t){let e=this.styleSheets,o=this.styleClass;t=this.normalizeTarget(t);for(let n=0;n<e.length;n++){let i=document.createElement("style");i.innerHTML=e[n],i.className=o,t.append(i)}super.addStylesTo(t)}removeStylesFrom(t){t=this.normalizeTarget(t);let e=t.querySelectorAll(`.${this.styleClass}`);for(let o=0,n=e.length;o<n;++o)t.removeChild(e[o]);super.removeStylesFrom(t)}isAttachedTo(t){return super.isAttachedTo(this.normalizeTarget(t))}normalizeTarget(t){return t===document?document.body:t}};var kt=Object.freeze({locate:Ft()}),ye={toView(r){return r?"true":"false"},fromView(r){return!(r==null||r==="false"||r===!1||r===0)}},V={toView(r){if(r==null)return null;let t=r*1;return isNaN(t)?null:t.toString()},fromView(r){if(r==null)return null;let t=r*1;return isNaN(t)?null:t}},Nt=class r{constructor(t,e,o=e.toLowerCase(),n="reflect",i){this.guards=new Set,this.Owner=t,this.name=e,this.attribute=o,this.mode=n,this.converter=i,this.fieldName=`_${e}`,this.callbackName=`${e}Changed`,this.hasCallback=this.callbackName in t.prototype,n==="boolean"&&i===void 0&&(this.converter=ye)}setValue(t,e){let o=t[this.fieldName],n=this.converter;n!==void 0&&(e=n.fromView(e)),o!==e&&(t[this.fieldName]=e,this.tryReflectToAttribute(t),this.hasCallback&&t[this.callbackName](o,e),t.$fastController.notify(this.name))}getValue(t){return g.track(t,this.name),t[this.fieldName]}onAttributeChangedCallback(t,e){this.guards.has(t)||(this.guards.add(t),this.setValue(t,e),this.guards.delete(t))}tryReflectToAttribute(t){let e=this.mode,o=this.guards;o.has(t)||e==="fromView"||p.queueUpdate(()=>{o.add(t);let n=t[this.fieldName];switch(e){case"reflect":let i=this.converter;p.setAttribute(t,this.attribute,i!==void 0?i.toView(n):n);break;case"boolean":p.setBooleanAttribute(t,this.attribute,n);break}o.delete(t)})}static collect(t,...e){let o=[];e.push(kt.locate(t));for(let n=0,i=e.length;n<i;++n){let s=e[n];if(s!==void 0)for(let a=0,u=s.length;a<u;++a){let l=s[a];typeof l=="string"?o.push(new r(t,l)):o.push(new r(t,l.property,l.attribute,l.mode,l.converter))}}return o}};function h(r,t){let e;function o(n,i){arguments.length>1&&(e.property=i),kt.locate(n.constructor).push(e)}if(arguments.length>1){e={},o(r,t);return}return e=r===void 0?{}:r,o}var fr={mode:"open"},pr={},ve=X.getById(4,()=>{let r=new Map;return Object.freeze({register(t){return r.has(t.type)?!1:(r.set(t.type,t),!0)},getByType(t){return r.get(t)}})}),L=class{constructor(t,e=t.definition){typeof e=="string"&&(e={name:e}),this.type=t,this.name=e.name,this.template=e.template;let o=Nt.collect(t,e.attributes),n=new Array(o.length),i={},s={};for(let a=0,u=o.length;a<u;++a){let l=o[a];n[a]=l.attribute,i[l.name]=l,s[l.attribute]=l}this.attributes=o,this.observedAttributes=n,this.propertyLookup=i,this.attributeLookup=s,this.shadowOptions=e.shadowOptions===void 0?fr:e.shadowOptions===null?void 0:Object.assign(Object.assign({},fr),e.shadowOptions),this.elementOptions=e.elementOptions===void 0?pr:Object.assign(Object.assign({},pr),e.elementOptions),this.styles=e.styles===void 0?void 0:Array.isArray(e.styles)?v.create(e.styles):e.styles instanceof v?e.styles:v.create([e.styles])}get isDefined(){return!!ve.getByType(this.type)}define(t=customElements){let e=this.type;if(ve.register(this)){let o=this.attributes,n=e.prototype;for(let i=0,s=o.length;i<s;++i)g.defineProperty(n,o[i]);Reflect.defineProperty(e,"observedAttributes",{value:this.observedAttributes,enumerable:!0})}return t.get(this.name)||t.define(this.name,e,this.elementOptions),this}};L.forType=ve.getByType;var mr=new WeakMap,Io={bubbles:!0,composed:!0,cancelable:!0};function xe(r){return r.shadowRoot||mr.get(r)||null}var jt=class r extends lt{constructor(t,e){super(t),this.boundObservables=null,this.behaviors=null,this.needsInitialization=!0,this._template=null,this._styles=null,this._isConnected=!1,this.$fastController=this,this.view=null,this.element=t,this.definition=e;let o=e.shadowOptions;if(o!==void 0){let i=t.attachShadow(o);o.mode==="closed"&&mr.set(t,i)}let n=g.getAccessors(t);if(n.length>0){let i=this.boundObservables=Object.create(null);for(let s=0,a=n.length;s<a;++s){let u=n[s].name,l=t[u];l!==void 0&&(delete t[u],i[u]=l)}}}get isConnected(){return g.track(this,"isConnected"),this._isConnected}setIsConnected(t){this._isConnected=t,g.notify(this,"isConnected")}get template(){return this._template}set template(t){this._template!==t&&(this._template=t,this.needsInitialization||this.renderTemplate(t))}get styles(){return this._styles}set styles(t){this._styles!==t&&(this._styles!==null&&this.removeStyles(this._styles),this._styles=t,!this.needsInitialization&&t!==null&&this.addStyles(t))}addStyles(t){let e=xe(this.element)||this.element.getRootNode();if(t instanceof HTMLStyleElement)e.append(t);else if(!t.isAttachedTo(e)){let o=t.behaviors;t.addStylesTo(e),o!==null&&this.addBehaviors(o)}}removeStyles(t){let e=xe(this.element)||this.element.getRootNode();if(t instanceof HTMLStyleElement)e.removeChild(t);else if(t.isAttachedTo(e)){let o=t.behaviors;t.removeStylesFrom(e),o!==null&&this.removeBehaviors(o)}}addBehaviors(t){let e=this.behaviors||(this.behaviors=new Map),o=t.length,n=[];for(let i=0;i<o;++i){let s=t[i];e.has(s)?e.set(s,e.get(s)+1):(e.set(s,1),n.push(s))}if(this._isConnected){let i=this.element;for(let s=0;s<n.length;++s)n[s].bind(i,U)}}removeBehaviors(t,e=!1){let o=this.behaviors;if(o===null)return;let n=t.length,i=[];for(let s=0;s<n;++s){let a=t[s];if(o.has(a)){let u=o.get(a)-1;u===0||e?o.delete(a)&&i.push(a):o.set(a,u)}}if(this._isConnected){let s=this.element;for(let a=0;a<i.length;++a)i[a].unbind(s)}}onConnectedCallback(){if(this._isConnected)return;let t=this.element;this.needsInitialization?this.finishInitialization():this.view!==null&&this.view.bind(t,U);let e=this.behaviors;if(e!==null)for(let[o]of e)o.bind(t,U);this.setIsConnected(!0)}onDisconnectedCallback(){if(!this._isConnected)return;this.setIsConnected(!1);let t=this.view;t!==null&&t.unbind();let e=this.behaviors;if(e!==null){let o=this.element;for(let[n]of e)n.unbind(o)}}onAttributeChangedCallback(t,e,o){let n=this.definition.attributeLookup[t];n!==void 0&&n.onAttributeChangedCallback(this.element,o)}emit(t,e,o){return this._isConnected?this.element.dispatchEvent(new CustomEvent(t,Object.assign(Object.assign({detail:e},Io),o))):!1}finishInitialization(){let t=this.element,e=this.boundObservables;if(e!==null){let n=Object.keys(e);for(let i=0,s=n.length;i<s;++i){let a=n[i];t[a]=e[a]}this.boundObservables=null}let o=this.definition;this._template===null&&(this.element.resolveTemplate?this._template=this.element.resolveTemplate():o.template&&(this._template=o.template||null)),this._template!==null&&this.renderTemplate(this._template),this._styles===null&&(this.element.resolveStyles?this._styles=this.element.resolveStyles():o.styles&&(this._styles=o.styles||null)),this._styles!==null&&this.addStyles(this._styles),this.needsInitialization=!1}renderTemplate(t){let e=this.element,o=xe(e)||e;this.view!==null?(this.view.dispose(),this.view=null):this.needsInitialization||p.removeChildNodes(o),t&&(this.view=t.render(e,o,e))}static forCustomElement(t){let e=t.$fastController;if(e!==void 0)return e;let o=L.forType(t.constructor);if(o===void 0)throw new Error("Missing FASTElement definition.");return t.$fastController=new r(t,o)}};function br(r){return class extends r{constructor(){super(),jt.forCustomElement(this)}$emit(t,e,o){return this.$fastController.emit(t,e,o)}connectedCallback(){this.$fastController.onConnectedCallback()}disconnectedCallback(){this.$fastController.onDisconnectedCallback()}attributeChangedCallback(t,e,o){this.$fastController.onAttributeChangedCallback(t,e,o)}}}var W=Object.assign(br(HTMLElement),{from(r){return br(r)},define(r,t){return new L(r,t).define().type}});var Z=class{createCSS(){return""}createBehavior(){}};function Mo(r,t){let e=[],o="",n=[];for(let i=0,s=r.length-1;i<s;++i){o+=r[i];let a=t[i];if(a instanceof Z){let u=a.createBehavior();a=a.createCSS(),u&&n.push(u)}a instanceof v||a instanceof CSSStyleSheet?(o.trim()!==""&&(e.push(o),o=""),e.push(a)):o+=a}return o+=r[r.length-1],o.trim()!==""&&e.push(o),{styles:e,behaviors:n}}function _(r,...t){let{styles:e,behaviors:o}=Mo(r,t),n=v.create(e);return o.length&&n.withBehaviors(...o),n}var we=class{constructor(t,e){this.target=t,this.propertyName=e}bind(t){t[this.propertyName]=this.target}unbind(){}};function E(r){return new dt("fast-ref",we,r)}var Vt=class{constructor(t,e){this.target=t,this.options=e,this.source=null}bind(t){let e=this.options.property;this.shouldUpdate=g.getAccessors(t).some(o=>o.name===e),this.source=t,this.updateTarget(this.computeNodes()),this.shouldUpdate&&this.observe()}unbind(){this.updateTarget(z),this.source=null,this.shouldUpdate&&this.disconnect()}handleEvent(){this.updateTarget(this.computeNodes())}computeNodes(){let t=this.getNodes();return this.options.filter!==void 0&&(t=t.filter(this.options.filter)),t}updateTarget(t){this.source[this.options.property]=t}};var ke=class extends Vt{constructor(t,e){super(t,e)}observe(){this.target.addEventListener("slotchange",this)}disconnect(){this.target.removeEventListener("slotchange",this)}getNodes(){return this.target.assignedNodes(this.options)}};function ht(r){return typeof r=="string"&&(r={property:r}),new dt("fast-slotted",ke,r)}var ft=class{handleStartContentChange(){this.startContainer.classList.toggle("start",this.start.assignedNodes().length>0)}handleEndContentChange(){this.endContainer.classList.toggle("end",this.end.assignedNodes().length>0)}},gr=(r,t)=>D`
    <span
        part="end"
        ${E("endContainer")}
        class=${e=>t.end?"end":void 0}
    >
        <slot name="end" ${E("end")} @slotchange="${e=>e.handleEndContentChange()}">
            ${t.end||""}
        </slot>
    </span>
`,yr=(r,t)=>D`
    <span
        part="start"
        ${E("startContainer")}
        class="${e=>t.start?"start":void 0}"
    >
        <slot
            name="start"
            ${E("start")}
            @slotchange="${e=>e.handleStartContentChange()}"
        >
            ${t.start||""}
        </slot>
    </span>
`,Di=D`
    <span part="end" ${E("endContainer")}>
        <slot
            name="end"
            ${E("end")}
            @slotchange="${r=>r.handleEndContentChange()}"
        ></slot>
    </span>
`,_i=D`
    <span part="start" ${E("startContainer")}>
        <slot
            name="start"
            ${E("start")}
            @slotchange="${r=>r.handleStartContentChange()}"
        ></slot>
    </span>
`;function c(r,t,e,o){var n=arguments.length,i=n<3?t:o===null?o=Object.getOwnPropertyDescriptor(t,e):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(r,t,e,o);else for(var a=r.length-1;a>=0;a--)(s=r[a])&&(i=(n<3?s(i):n>3?s(t,e,i):s(t,e))||i);return n>3&&i&&Object.defineProperty(t,e,i),i}var Ce=new Map;"metadata"in Reflect||(Reflect.metadata=function(r,t){return function(e){Reflect.defineMetadata(r,t,e)}},Reflect.defineMetadata=function(r,t,e){let o=Ce.get(e);o===void 0&&Ce.set(e,o=new Map),o.set(r,t)},Reflect.getOwnMetadata=function(r,t){let e=Ce.get(t);if(e!==void 0)return e.get(r)});var Pe=class{constructor(t,e){this.container=t,this.key=e}instance(t){return this.registerResolver(0,t)}singleton(t){return this.registerResolver(1,t)}transient(t){return this.registerResolver(2,t)}callback(t){return this.registerResolver(3,t)}cachedCallback(t){return this.registerResolver(3,Rr(t))}aliasTo(t){return this.registerResolver(5,t)}registerResolver(t,e){let{container:o,key:n}=this;return this.container=this.key=void 0,o.registerResolver(n,new S(n,t,e))}};function Ct(r){let t=r.slice(),e=Object.keys(r),o=e.length,n;for(let i=0;i<o;++i)n=e[i],Er(n)||(t[n]=r[n]);return t}var Lo=Object.freeze({none(r){throw Error(`${r.toString()} not registered, did you forget to add @singleton()?`)},singleton(r){return new S(r,1,r)},transient(r){return new S(r,2,r)}}),Se=Object.freeze({default:Object.freeze({parentLocator:()=>null,responsibleForOwnerRequests:!1,defaultResolver:Lo.singleton})}),vr=new Map;function xr(r){return t=>Reflect.getOwnMetadata(r,t)}var wr=null,b=Object.freeze({createContainer(r){return new St(null,Object.assign({},Se.default,r))},findResponsibleContainer(r){let t=r.$$container$$;return t&&t.responsibleForOwnerRequests?t:b.findParentContainer(r)},findParentContainer(r){let t=new CustomEvent(Or,{bubbles:!0,composed:!0,cancelable:!0,detail:{container:void 0}});return r.dispatchEvent(t),t.detail.container||b.getOrCreateDOMContainer()},getOrCreateDOMContainer(r,t){return r?r.$$container$$||new St(r,Object.assign({},Se.default,t,{parentLocator:b.findParentContainer})):wr||(wr=new St(null,Object.assign({},Se.default,t,{parentLocator:()=>null})))},getDesignParamtypes:xr("design:paramtypes"),getAnnotationParamtypes:xr("di:paramtypes"),getOrCreateAnnotationParamTypes(r){let t=this.getAnnotationParamtypes(r);return t===void 0&&Reflect.defineMetadata("di:paramtypes",t=[],r),t},getDependencies(r){let t=vr.get(r);if(t===void 0){let e=r.inject;if(e===void 0){let o=b.getDesignParamtypes(r),n=b.getAnnotationParamtypes(r);if(o===void 0)if(n===void 0){let i=Object.getPrototypeOf(r);typeof i=="function"&&i!==Function.prototype?t=Ct(b.getDependencies(i)):t=[]}else t=Ct(n);else if(n===void 0)t=Ct(o);else{t=Ct(o);let i=n.length,s;for(let l=0;l<i;++l)s=n[l],s!==void 0&&(t[l]=s);let a=Object.keys(n);i=a.length;let u;for(let l=0;l<i;++l)u=a[l],Er(u)||(t[u]=n[u])}}else t=Ct(e);vr.set(r,t)}return t},defineProperty(r,t,e,o=!1){let n=`$di_${t}`;Reflect.defineProperty(r,t,{get:function(){let i=this[n];if(i===void 0&&(i=(this instanceof HTMLElement?b.findResponsibleContainer(this):b.getOrCreateDOMContainer()).get(e),this[n]=i,o&&this instanceof W)){let a=this.$fastController,u=()=>{let f=b.findResponsibleContainer(this).get(e),m=this[n];f!==m&&(this[n]=i,a.notify(t))};a.subscribe({handleChange:u},"isConnected")}return i}})},createInterface(r,t){let e=typeof r=="function"?r:t,o=typeof r=="string"?r:r&&"friendlyName"in r&&r.friendlyName||$r,n=typeof r=="string"?!1:r&&"respectConnection"in r&&r.respectConnection||!1,i=function(s,a,u){if(s==null||new.target!==void 0)throw new Error(`No registration for interface: '${i.friendlyName}'`);if(a)b.defineProperty(s,a,i,n);else{let l=b.getOrCreateAnnotationParamTypes(s);l[u]=i}};return i.$isInterface=!0,i.friendlyName=o??"(anonymous)",e!=null&&(i.register=function(s,a){return e(new Pe(s,a??i))}),i.toString=function(){return`InterfaceSymbol<${i.friendlyName}>`},i},inject(...r){return function(t,e,o){if(typeof o=="number"){let n=b.getOrCreateAnnotationParamTypes(t),i=r[0];i!==void 0&&(n[o]=i)}else if(e)b.defineProperty(t,e,r[0]);else{let n=o?b.getOrCreateAnnotationParamTypes(o.value):b.getOrCreateAnnotationParamTypes(t),i;for(let s=0;s<r.length;++s)i=r[s],i!==void 0&&(n[s]=i)}}},transient(r){return r.register=function(e){return K.transient(r,r).register(e)},r.registerInRequestor=!1,r},singleton(r,t=jo){return r.register=function(o){return K.singleton(r,r).register(o)},r.registerInRequestor=t.scoped,r}}),No=b.createInterface("Container");function Ut(r){return function(t){let e=function(o,n,i){b.inject(e)(o,n,i)};return e.$isResolver=!0,e.resolve=function(o,n){return r(t,o,n)},e}}var Mi=b.inject;var jo={scoped:!1};function Vo(r){return function(t,e){e=!!e;let o=function(n,i,s){b.inject(o)(n,i,s)};return o.$isResolver=!0,o.resolve=function(n,i){return r(t,n,i,e)},o}}var Li=Vo((r,t,e,o)=>e.getAll(r,o)),Ni=Ut((r,t,e)=>()=>e.get(r)),ji=Ut((r,t,e)=>{if(e.has(r,!0))return e.get(r)});function Re(r,t,e){b.inject(Re)(r,t,e)}Re.$isResolver=!0;Re.resolve=()=>{};var Vi=Ut((r,t,e)=>{let o=Pr(r,t),n=new S(r,0,o);return e.registerResolver(r,n),o}),Hi=Ut((r,t,e)=>Pr(r,t));function Pr(r,t){return t.getFactory(r).construct(t)}var S=class{constructor(t,e,o){this.key=t,this.strategy=e,this.state=o,this.resolving=!1}get $isResolver(){return!0}register(t){return t.registerResolver(this.key,this)}resolve(t,e){switch(this.strategy){case 0:return this.state;case 1:{if(this.resolving)throw new Error(`Cyclic dependency found: ${this.state.name}`);return this.resolving=!0,this.state=t.getFactory(this.state).construct(e),this.strategy=0,this.resolving=!1,this.state}case 2:{let o=t.getFactory(this.state);if(o===null)throw new Error(`Resolver for ${String(this.key)} returned a null factory`);return o.construct(e)}case 3:return this.state(t,e,this);case 4:return this.state[0].resolve(t,e);case 5:return e.get(this.state);default:throw new Error(`Invalid resolver strategy specified: ${this.strategy}.`)}}getFactory(t){var e,o,n;switch(this.strategy){case 1:case 2:return t.getFactory(this.state);case 5:return(n=(o=(e=t.getResolver(this.state))===null||e===void 0?void 0:e.getFactory)===null||o===void 0?void 0:o.call(e,t))!==null&&n!==void 0?n:null;default:return null}}};function kr(r){return this.get(r)}function Ho(r,t){return t(r)}var Oe=class{constructor(t,e){this.Type=t,this.dependencies=e,this.transformers=null}construct(t,e){let o;return e===void 0?o=new this.Type(...this.dependencies.map(kr,t)):o=new this.Type(...this.dependencies.map(kr,t),...e),this.transformers==null?o:this.transformers.reduce(Ho,o)}registerTransformer(t){(this.transformers||(this.transformers=[])).push(t)}},zo={$isResolver:!0,resolve(r,t){return t}};function qt(r){return typeof r.register=="function"}function qo(r){return qt(r)&&typeof r.registerInRequestor=="boolean"}function Cr(r){return qo(r)&&r.registerInRequestor}function Uo(r){return r.prototype!==void 0}var Wo=new Set(["Array","ArrayBuffer","Boolean","DataView","Date","Error","EvalError","Float32Array","Float64Array","Function","Int8Array","Int16Array","Int32Array","Map","Number","Object","Promise","RangeError","ReferenceError","RegExp","Set","SharedArrayBuffer","String","SyntaxError","TypeError","Uint8Array","Uint8ClampedArray","Uint16Array","Uint32Array","URIError","WeakMap","WeakSet"]),Or="__DI_LOCATE_PARENT__",$e=new Map,St=class r{constructor(t,e){this.owner=t,this.config=e,this._parent=void 0,this.registerDepth=0,this.context=null,t!==null&&(t.$$container$$=this),this.resolvers=new Map,this.resolvers.set(No,zo),t instanceof Node&&t.addEventListener(Or,o=>{o.composedPath()[0]!==this.owner&&(o.detail.container=this,o.stopImmediatePropagation())})}get parent(){return this._parent===void 0&&(this._parent=this.config.parentLocator(this.owner)),this._parent}get depth(){return this.parent===null?0:this.parent.depth+1}get responsibleForOwnerRequests(){return this.config.responsibleForOwnerRequests}registerWithContext(t,...e){return this.context=t,this.register(...e),this.context=null,this}register(...t){if(++this.registerDepth===100)throw new Error("Unable to autoregister dependency");let e,o,n,i,s,a=this.context;for(let u=0,l=t.length;u<l;++u)if(e=t[u],!!Tr(e))if(qt(e))e.register(this,a);else if(Uo(e))K.singleton(e,e).register(this);else for(o=Object.keys(e),i=0,s=o.length;i<s;++i)n=e[o[i]],Tr(n)&&(qt(n)?n.register(this,a):this.register(n));return--this.registerDepth,this}registerResolver(t,e){Ht(t);let o=this.resolvers,n=o.get(t);return n==null?o.set(t,e):n instanceof S&&n.strategy===4?n.state.push(e):o.set(t,new S(t,4,[n,e])),e}registerTransformer(t,e){let o=this.getResolver(t);if(o==null)return!1;if(o.getFactory){let n=o.getFactory(this);return n==null?!1:(n.registerTransformer(e),!0)}return!1}getResolver(t,e=!0){if(Ht(t),t.resolve!==void 0)return t;let o=this,n;for(;o!=null;)if(n=o.resolvers.get(t),n==null){if(o.parent==null){let i=Cr(t)?this:o;return e?this.jitRegister(t,i):null}o=o.parent}else return n;return null}has(t,e=!1){return this.resolvers.has(t)?!0:e&&this.parent!=null?this.parent.has(t,!0):!1}get(t){if(Ht(t),t.$isResolver)return t.resolve(this,this);let e=this,o;for(;e!=null;)if(o=e.resolvers.get(t),o==null){if(e.parent==null){let n=Cr(t)?this:e;return o=this.jitRegister(t,n),o.resolve(e,this)}e=e.parent}else return o.resolve(e,this);throw new Error(`Unable to resolve key: ${String(t)}`)}getAll(t,e=!1){Ht(t);let o=this,n=o,i;if(e){let s=z;for(;n!=null;)i=n.resolvers.get(t),i!=null&&(s=s.concat(Sr(i,n,o))),n=n.parent;return s}else for(;n!=null;)if(i=n.resolvers.get(t),i==null){if(n=n.parent,n==null)return z}else return Sr(i,n,o);return z}getFactory(t){let e=$e.get(t);if(e===void 0){if(Go(t))throw new Error(`${t.name} is a native function and therefore cannot be safely constructed by DI. If this is intentional, please use a callback or cachedCallback resolver.`);$e.set(t,e=new Oe(t,b.getDependencies(t)))}return e}registerFactory(t,e){$e.set(t,e)}createChild(t){return new r(null,Object.assign({},this.config,t,{parentLocator:()=>this}))}jitRegister(t,e){if(typeof t!="function")throw new Error(`Attempted to jitRegister something that is not a constructor: '${t}'. Did you forget to register this dependency?`);if(Wo.has(t.name))throw new Error(`Attempted to jitRegister an intrinsic type: ${t.name}. Did you forget to add @inject(Key)`);if(qt(t)){let o=t.register(e);if(!(o instanceof Object)||o.resolve==null){let n=e.resolvers.get(t);if(n!=null)return n;throw new Error("A valid resolver was not returned from the static register method")}return o}else{if(t.$isInterface)throw new Error(`Attempted to jitRegister an interface: ${t.friendlyName}`);{let o=this.config.defaultResolver(t,e);return e.resolvers.set(t,o),o}}}},Te=new WeakMap;function Rr(r){return function(t,e,o){if(Te.has(o))return Te.get(o);let n=r(t,e,o);return Te.set(o,n),n}}var K=Object.freeze({instance(r,t){return new S(r,0,t)},singleton(r,t){return new S(r,1,t)},transient(r,t){return new S(r,2,t)},callback(r,t){return new S(r,3,t)},cachedCallback(r,t){return new S(r,3,Rr(t))},aliasTo(r,t){return new S(t,5,r)}});function Ht(r){if(r==null)throw new Error("key/value cannot be null or undefined. Are you trying to inject/register something that doesn't exist with DI?")}function Sr(r,t,e){if(r instanceof S&&r.strategy===4){let o=r.state,n=o.length,i=new Array(n);for(;n--;)i[n]=o[n].resolve(t,e);return i}return[r.resolve(t,e)]}var $r="(anonymous)";function Tr(r){return typeof r=="object"&&r!==null||typeof r=="function"}var Go=function(){let r=new WeakMap,t=!1,e="",o=0;return function(n){return t=r.get(n),t===void 0&&(e=n.toString(),o=e.length,t=o>=29&&o<=100&&e.charCodeAt(o-1)===125&&e.charCodeAt(o-2)<=32&&e.charCodeAt(o-3)===93&&e.charCodeAt(o-4)===101&&e.charCodeAt(o-5)===100&&e.charCodeAt(o-6)===111&&e.charCodeAt(o-7)===99&&e.charCodeAt(o-8)===32&&e.charCodeAt(o-9)===101&&e.charCodeAt(o-10)===118&&e.charCodeAt(o-11)===105&&e.charCodeAt(o-12)===116&&e.charCodeAt(o-13)===97&&e.charCodeAt(o-14)===110&&e.charCodeAt(o-15)===88,r.set(n,t)),t}}(),zt={};function Er(r){switch(typeof r){case"number":return r>=0&&(r|0)===r;case"string":{let t=zt[r];if(t!==void 0)return t;let e=r.length;if(e===0)return zt[r]=!1;let o=0;for(let n=0;n<e;++n)if(o=r.charCodeAt(n),n===0&&o===48&&e>1||o<48||o>57)return zt[r]=!1;return zt[r]=!0}default:return!1}}function Ar(r){return`${r.toLowerCase()}:presentation`}var Wt=new Map,Qt=Object.freeze({define(r,t,e){let o=Ar(r);Wt.get(o)===void 0?Wt.set(o,t):Wt.set(o,!1),e.register(K.instance(o,t))},forTag(r,t){let e=Ar(r),o=Wt.get(e);return o===!1?b.findResponsibleContainer(t).get(e):o||null}}),Gt=class{constructor(t,e){this.template=t||null,this.styles=e===void 0?null:Array.isArray(e)?v.create(e):e instanceof v?e:v.create([e])}applyTo(t){let e=t.$fastController;e.template===null&&(e.template=this.template),e.styles===null&&(e.styles=this.styles)}};var T=class r extends W{constructor(){super(...arguments),this._presentation=void 0}get $presentation(){return this._presentation===void 0&&(this._presentation=Qt.forTag(this.tagName,this)),this._presentation}templateChanged(){this.template!==void 0&&(this.$fastController.template=this.template)}stylesChanged(){this.styles!==void 0&&(this.$fastController.styles=this.styles)}connectedCallback(){this.$presentation!==null&&this.$presentation.applyTo(this),super.connectedCallback()}static compose(t){return(e={})=>new Ee(this===r?class extends r{}:this,t,e)}};c([x],T.prototype,"template",void 0);c([x],T.prototype,"styles",void 0);function $t(r,t,e){return typeof r=="function"?r(t,e):r}var Ee=class{constructor(t,e,o){this.type=t,this.elementDefinition=e,this.overrideDefinition=o,this.definition=Object.assign(Object.assign({},this.elementDefinition),this.overrideDefinition)}register(t,e){let o=this.definition,n=this.overrideDefinition,s=`${o.prefix||e.elementPrefix}-${o.baseName}`;e.tryDefineElement({name:s,type:this.type,baseClass:this.elementDefinition.baseClass,callback:a=>{let u=new Gt($t(o.template,a,o),$t(o.styles,a,o));a.definePresentation(u);let l=$t(o.shadowOptions,a,o);a.shadowRootMode&&(l?n.shadowOptions||(l.mode=a.shadowRootMode):l!==null&&(l={mode:a.shadowRootMode})),a.defineElement({elementOptions:$t(o.elementOptions,a,o),shadowOptions:l,attributes:$t(o.attributes,a,o)})}})}};function G(r,...t){let e=kt.locate(r);t.forEach(o=>{Object.getOwnPropertyNames(o.prototype).forEach(i=>{i!=="constructor"&&Object.defineProperty(r.prototype,i,Object.getOwnPropertyDescriptor(o.prototype,i))}),kt.locate(o).forEach(i=>e.push(i))})}function Dr(){return!!(typeof window<"u"&&window.document&&window.document.createElement)}function Qo(){let r=document.querySelector('meta[property="csp-nonce"]');return r?r.getAttribute("content"):null}var tt;function _r(){if(typeof tt=="boolean")return tt;if(!Dr())return tt=!1,tt;let r=document.createElement("style"),t=Qo();t!==null&&r.setAttribute("nonce",t),document.head.appendChild(r);try{r.sheet.insertRule("foo:focus-visible {color:inherit}",0),tt=!0}catch{tt=!1}finally{document.head.removeChild(r)}return tt}var Br;(function(r){r[r.alt=18]="alt",r[r.arrowDown=40]="arrowDown",r[r.arrowLeft=37]="arrowLeft",r[r.arrowRight=39]="arrowRight",r[r.arrowUp=38]="arrowUp",r[r.back=8]="back",r[r.backSlash=220]="backSlash",r[r.break=19]="break",r[r.capsLock=20]="capsLock",r[r.closeBracket=221]="closeBracket",r[r.colon=186]="colon",r[r.colon2=59]="colon2",r[r.comma=188]="comma",r[r.ctrl=17]="ctrl",r[r.delete=46]="delete",r[r.end=35]="end",r[r.enter=13]="enter",r[r.equals=187]="equals",r[r.equals2=61]="equals2",r[r.equals3=107]="equals3",r[r.escape=27]="escape",r[r.forwardSlash=191]="forwardSlash",r[r.function1=112]="function1",r[r.function10=121]="function10",r[r.function11=122]="function11",r[r.function12=123]="function12",r[r.function2=113]="function2",r[r.function3=114]="function3",r[r.function4=115]="function4",r[r.function5=116]="function5",r[r.function6=117]="function6",r[r.function7=118]="function7",r[r.function8=119]="function8",r[r.function9=120]="function9",r[r.home=36]="home",r[r.insert=45]="insert",r[r.menu=93]="menu",r[r.minus=189]="minus",r[r.minus2=109]="minus2",r[r.numLock=144]="numLock",r[r.numPad0=96]="numPad0",r[r.numPad1=97]="numPad1",r[r.numPad2=98]="numPad2",r[r.numPad3=99]="numPad3",r[r.numPad4=100]="numPad4",r[r.numPad5=101]="numPad5",r[r.numPad6=102]="numPad6",r[r.numPad7=103]="numPad7",r[r.numPad8=104]="numPad8",r[r.numPad9=105]="numPad9",r[r.numPadDivide=111]="numPadDivide",r[r.numPadDot=110]="numPadDot",r[r.numPadMinus=109]="numPadMinus",r[r.numPadMultiply=106]="numPadMultiply",r[r.numPadPlus=107]="numPadPlus",r[r.openBracket=219]="openBracket",r[r.pageDown=34]="pageDown",r[r.pageUp=33]="pageUp",r[r.period=190]="period",r[r.print=44]="print",r[r.quote=222]="quote",r[r.scrollLock=145]="scrollLock",r[r.shift=16]="shift",r[r.space=32]="space",r[r.tab=9]="tab",r[r.tilde=192]="tilde",r[r.windowsLeft=91]="windowsLeft",r[r.windowsOpera=219]="windowsOpera",r[r.windowsRight=92]="windowsRight"})(Br||(Br={}));var Fr="Enter";var Ir=" ";var y=class{};c([h({attribute:"aria-atomic"})],y.prototype,"ariaAtomic",void 0);c([h({attribute:"aria-busy"})],y.prototype,"ariaBusy",void 0);c([h({attribute:"aria-controls"})],y.prototype,"ariaControls",void 0);c([h({attribute:"aria-current"})],y.prototype,"ariaCurrent",void 0);c([h({attribute:"aria-describedby"})],y.prototype,"ariaDescribedby",void 0);c([h({attribute:"aria-details"})],y.prototype,"ariaDetails",void 0);c([h({attribute:"aria-disabled"})],y.prototype,"ariaDisabled",void 0);c([h({attribute:"aria-errormessage"})],y.prototype,"ariaErrormessage",void 0);c([h({attribute:"aria-flowto"})],y.prototype,"ariaFlowto",void 0);c([h({attribute:"aria-haspopup"})],y.prototype,"ariaHaspopup",void 0);c([h({attribute:"aria-hidden"})],y.prototype,"ariaHidden",void 0);c([h({attribute:"aria-invalid"})],y.prototype,"ariaInvalid",void 0);c([h({attribute:"aria-keyshortcuts"})],y.prototype,"ariaKeyshortcuts",void 0);c([h({attribute:"aria-label"})],y.prototype,"ariaLabel",void 0);c([h({attribute:"aria-labelledby"})],y.prototype,"ariaLabelledby",void 0);c([h({attribute:"aria-live"})],y.prototype,"ariaLive",void 0);c([h({attribute:"aria-owns"})],y.prototype,"ariaOwns",void 0);c([h({attribute:"aria-relevant"})],y.prototype,"ariaRelevant",void 0);c([h({attribute:"aria-roledescription"})],y.prototype,"ariaRoledescription",void 0);var Mr=(r,t)=>D`
    <button
        class="control"
        part="control"
        ?autofocus="${e=>e.autofocus}"
        ?disabled="${e=>e.disabled}"
        form="${e=>e.formId}"
        formaction="${e=>e.formaction}"
        formenctype="${e=>e.formenctype}"
        formmethod="${e=>e.formmethod}"
        formnovalidate="${e=>e.formnovalidate}"
        formtarget="${e=>e.formtarget}"
        name="${e=>e.name}"
        type="${e=>e.type}"
        value="${e=>e.value}"
        aria-atomic="${e=>e.ariaAtomic}"
        aria-busy="${e=>e.ariaBusy}"
        aria-controls="${e=>e.ariaControls}"
        aria-current="${e=>e.ariaCurrent}"
        aria-describedby="${e=>e.ariaDescribedby}"
        aria-details="${e=>e.ariaDetails}"
        aria-disabled="${e=>e.ariaDisabled}"
        aria-errormessage="${e=>e.ariaErrormessage}"
        aria-expanded="${e=>e.ariaExpanded}"
        aria-flowto="${e=>e.ariaFlowto}"
        aria-haspopup="${e=>e.ariaHaspopup}"
        aria-hidden="${e=>e.ariaHidden}"
        aria-invalid="${e=>e.ariaInvalid}"
        aria-keyshortcuts="${e=>e.ariaKeyshortcuts}"
        aria-label="${e=>e.ariaLabel}"
        aria-labelledby="${e=>e.ariaLabelledby}"
        aria-live="${e=>e.ariaLive}"
        aria-owns="${e=>e.ariaOwns}"
        aria-pressed="${e=>e.ariaPressed}"
        aria-relevant="${e=>e.ariaRelevant}"
        aria-roledescription="${e=>e.ariaRoledescription}"
        ${E("control")}
    >
        ${yr(r,t)}
        <span class="content" part="content">
            <slot ${ht("defaultSlottedContent")}></slot>
        </span>
        ${gr(r,t)}
    </button>
`;var Lr="form-associated-proxy",Nr="ElementInternals",jr=Nr in window&&"setFormValue"in window[Nr].prototype,Vr=new WeakMap;function et(r){let t=class extends r{constructor(...e){super(...e),this.dirtyValue=!1,this.disabled=!1,this.proxyEventsToBlock=["change","click"],this.proxyInitialized=!1,this.required=!1,this.initialValue=this.initialValue||"",this.elementInternals||(this.formResetCallback=this.formResetCallback.bind(this))}static get formAssociated(){return jr}get validity(){return this.elementInternals?this.elementInternals.validity:this.proxy.validity}get form(){return this.elementInternals?this.elementInternals.form:this.proxy.form}get validationMessage(){return this.elementInternals?this.elementInternals.validationMessage:this.proxy.validationMessage}get willValidate(){return this.elementInternals?this.elementInternals.willValidate:this.proxy.willValidate}get labels(){if(this.elementInternals)return Object.freeze(Array.from(this.elementInternals.labels));if(this.proxy instanceof HTMLElement&&this.proxy.ownerDocument&&this.id){let e=this.proxy.labels,o=Array.from(this.proxy.getRootNode().querySelectorAll(`[for='${this.id}']`)),n=e?o.concat(Array.from(e)):o;return Object.freeze(n)}else return z}valueChanged(e,o){this.dirtyValue=!0,this.proxy instanceof HTMLElement&&(this.proxy.value=this.value),this.currentValue=this.value,this.setFormValue(this.value),this.validate()}currentValueChanged(){this.value=this.currentValue}initialValueChanged(e,o){this.dirtyValue||(this.value=this.initialValue,this.dirtyValue=!1)}disabledChanged(e,o){this.proxy instanceof HTMLElement&&(this.proxy.disabled=this.disabled),p.queueUpdate(()=>this.classList.toggle("disabled",this.disabled))}nameChanged(e,o){this.proxy instanceof HTMLElement&&(this.proxy.name=this.name)}requiredChanged(e,o){this.proxy instanceof HTMLElement&&(this.proxy.required=this.required),p.queueUpdate(()=>this.classList.toggle("required",this.required)),this.validate()}get elementInternals(){if(!jr)return null;let e=Vr.get(this);return e||(e=this.attachInternals(),Vr.set(this,e)),e}connectedCallback(){super.connectedCallback(),this.addEventListener("keypress",this._keypressHandler),this.value||(this.value=this.initialValue,this.dirtyValue=!1),this.elementInternals||(this.attachProxy(),this.form&&this.form.addEventListener("reset",this.formResetCallback))}disconnectedCallback(){super.disconnectedCallback(),this.proxyEventsToBlock.forEach(e=>this.proxy.removeEventListener(e,this.stopPropagation)),!this.elementInternals&&this.form&&this.form.removeEventListener("reset",this.formResetCallback)}checkValidity(){return this.elementInternals?this.elementInternals.checkValidity():this.proxy.checkValidity()}reportValidity(){return this.elementInternals?this.elementInternals.reportValidity():this.proxy.reportValidity()}setValidity(e,o,n){this.elementInternals?this.elementInternals.setValidity(e,o,n):typeof o=="string"&&this.proxy.setCustomValidity(o)}formDisabledCallback(e){this.disabled=e}formResetCallback(){this.value=this.initialValue,this.dirtyValue=!1}attachProxy(){var e;this.proxyInitialized||(this.proxyInitialized=!0,this.proxy.style.display="none",this.proxyEventsToBlock.forEach(o=>this.proxy.addEventListener(o,this.stopPropagation)),this.proxy.disabled=this.disabled,this.proxy.required=this.required,typeof this.name=="string"&&(this.proxy.name=this.name),typeof this.value=="string"&&(this.proxy.value=this.value),this.proxy.setAttribute("slot",Lr),this.proxySlot=document.createElement("slot"),this.proxySlot.setAttribute("name",Lr)),(e=this.shadowRoot)===null||e===void 0||e.appendChild(this.proxySlot),this.appendChild(this.proxy)}detachProxy(){var e;this.removeChild(this.proxy),(e=this.shadowRoot)===null||e===void 0||e.removeChild(this.proxySlot)}validate(e){this.proxy instanceof HTMLElement&&this.setValidity(this.proxy.validity,this.proxy.validationMessage,e)}setFormValue(e,o){this.elementInternals&&this.elementInternals.setFormValue(e,o||e)}_keypressHandler(e){switch(e.key){case Fr:if(this.form instanceof HTMLFormElement){let o=this.form.querySelector("[type=submit]");o?.click()}break}}stopPropagation(e){e.stopPropagation()}};return h({mode:"boolean"})(t.prototype,"disabled"),h({mode:"fromView",attribute:"value"})(t.prototype,"initialValue"),h({attribute:"current-value"})(t.prototype,"currentValue"),h(t.prototype,"name"),h({mode:"boolean"})(t.prototype,"required"),x(t.prototype,"value"),t}function Hr(r){class t extends et(r){}class e extends t{constructor(...n){super(n),this.dirtyChecked=!1,this.checkedAttribute=!1,this.checked=!1,this.dirtyChecked=!1}checkedAttributeChanged(){this.defaultChecked=this.checkedAttribute}defaultCheckedChanged(){this.dirtyChecked||(this.checked=this.defaultChecked,this.dirtyChecked=!1)}checkedChanged(n,i){this.dirtyChecked||(this.dirtyChecked=!0),this.currentChecked=this.checked,this.updateForm(),this.proxy instanceof HTMLInputElement&&(this.proxy.checked=this.checked),n!==void 0&&this.$emit("change"),this.validate()}currentCheckedChanged(n,i){this.checked=this.currentChecked}updateForm(){let n=this.checked?this.value:null;this.setFormValue(n,n)}connectedCallback(){super.connectedCallback(),this.updateForm()}formResetCallback(){super.formResetCallback(),this.checked=!!this.checkedAttribute,this.dirtyChecked=!1}}return h({attribute:"checked",mode:"boolean"})(e.prototype,"checkedAttribute"),h({attribute:"current-checked",converter:ye})(e.prototype,"currentChecked"),x(e.prototype,"defaultChecked"),x(e.prototype,"checked"),e}var Ae=class extends T{},Jt=class extends et(Ae){constructor(){super(...arguments),this.proxy=document.createElement("input")}};var P=class extends Jt{constructor(){super(...arguments),this.handleClick=t=>{var e;this.disabled&&((e=this.defaultSlottedContent)===null||e===void 0?void 0:e.length)<=1&&t.stopPropagation()},this.handleSubmission=()=>{if(!this.form)return;let t=this.proxy.isConnected;t||this.attachProxy(),typeof this.form.requestSubmit=="function"?this.form.requestSubmit(this.proxy):this.proxy.click(),t||this.detachProxy()},this.handleFormReset=()=>{var t;(t=this.form)===null||t===void 0||t.reset()},this.handleUnsupportedDelegatesFocus=()=>{var t;window.ShadowRoot&&!window.ShadowRoot.prototype.hasOwnProperty("delegatesFocus")&&(!((t=this.$fastController.definition.shadowOptions)===null||t===void 0)&&t.delegatesFocus)&&(this.focus=()=>{this.control.focus()})}}formactionChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.formAction=this.formaction)}formenctypeChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.formEnctype=this.formenctype)}formmethodChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.formMethod=this.formmethod)}formnovalidateChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.formNoValidate=this.formnovalidate)}formtargetChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.formTarget=this.formtarget)}typeChanged(t,e){this.proxy instanceof HTMLInputElement&&(this.proxy.type=this.type),e==="submit"&&this.addEventListener("click",this.handleSubmission),t==="submit"&&this.removeEventListener("click",this.handleSubmission),e==="reset"&&this.addEventListener("click",this.handleFormReset),t==="reset"&&this.removeEventListener("click",this.handleFormReset)}validate(){super.validate(this.control)}connectedCallback(){var t;super.connectedCallback(),this.proxy.setAttribute("type",this.type),this.handleUnsupportedDelegatesFocus();let e=Array.from((t=this.control)===null||t===void 0?void 0:t.children);e&&e.forEach(o=>{o.addEventListener("click",this.handleClick)})}disconnectedCallback(){var t;super.disconnectedCallback();let e=Array.from((t=this.control)===null||t===void 0?void 0:t.children);e&&e.forEach(o=>{o.removeEventListener("click",this.handleClick)})}};c([h({mode:"boolean"})],P.prototype,"autofocus",void 0);c([h({attribute:"form"})],P.prototype,"formId",void 0);c([h],P.prototype,"formaction",void 0);c([h],P.prototype,"formenctype",void 0);c([h],P.prototype,"formmethod",void 0);c([h({mode:"boolean"})],P.prototype,"formnovalidate",void 0);c([h],P.prototype,"formtarget",void 0);c([h],P.prototype,"type",void 0);c([x],P.prototype,"defaultSlottedContent",void 0);var pt=class{};c([h({attribute:"aria-expanded"})],pt.prototype,"ariaExpanded",void 0);c([h({attribute:"aria-pressed"})],pt.prototype,"ariaPressed",void 0);G(pt,y);G(P,ft,pt);var zr=(r,t)=>D`
    <template
        role="checkbox"
        aria-checked="${e=>e.checked}"
        aria-required="${e=>e.required}"
        aria-disabled="${e=>e.disabled}"
        aria-readonly="${e=>e.readOnly}"
        tabindex="${e=>e.disabled?null:0}"
        @keypress="${(e,o)=>e.keypressHandler(o.event)}"
        @click="${(e,o)=>e.clickHandler(o.event)}"
        class="${e=>e.readOnly?"readonly":""} ${e=>e.checked?"checked":""} ${e=>e.indeterminate?"indeterminate":""}"
    >
        <div part="control" class="control">
            <slot name="checked-indicator">
                ${t.checkedIndicator||""}
            </slot>
            <slot name="indeterminate-indicator">
                ${t.indeterminateIndicator||""}
            </slot>
        </div>
        <label
            part="label"
            class="${e=>e.defaultSlottedNodes&&e.defaultSlottedNodes.length?"label":"label label__hidden"}"
        >
            <slot ${ht("defaultSlottedNodes")}></slot>
        </label>
    </template>
`;var De=class extends T{},Xt=class extends Hr(De){constructor(){super(...arguments),this.proxy=document.createElement("input")}};var rt=class extends Xt{constructor(){super(),this.initialValue="on",this.indeterminate=!1,this.keypressHandler=t=>{if(!this.readOnly)switch(t.key){case Ir:this.indeterminate&&(this.indeterminate=!1),this.checked=!this.checked;break}},this.clickHandler=t=>{!this.disabled&&!this.readOnly&&(this.indeterminate&&(this.indeterminate=!1),this.checked=!this.checked)},this.proxy.setAttribute("type","checkbox")}readOnlyChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.readOnly=this.readOnly)}};c([h({attribute:"readonly",mode:"boolean"})],rt.prototype,"readOnly",void 0);c([x],rt.prototype,"defaultSlottedNodes",void 0);c([x],rt.prototype,"indeterminate",void 0);function Tt(r){let t=r.parentElement;if(t)return t;{let e=r.getRootNode();if(e.host instanceof HTMLElement)return e.host}return null}function qr(r,t){let e=t;for(;e!==null;){if(e===r)return!0;e=Tt(e)}return!1}var N=document.createElement("div");function Jo(r){return r instanceof W}var Pt=class{setProperty(t,e){p.queueUpdate(()=>this.target.setProperty(t,e))}removeProperty(t){p.queueUpdate(()=>this.target.removeProperty(t))}},Be=class extends Pt{constructor(t){super();let e=new CSSStyleSheet;this.target=e.cssRules[e.insertRule(":host{}")].style,t.$fastController.addStyles(v.create([e]))}},Fe=class extends Pt{constructor(){super();let t=new CSSStyleSheet;this.target=t.cssRules[t.insertRule(":root{}")].style,document.adoptedStyleSheets=[...document.adoptedStyleSheets,t]}},Ie=class extends Pt{constructor(){super(),this.style=document.createElement("style"),document.head.appendChild(this.style);let{sheet:t}=this.style;if(t){let e=t.insertRule(":root{}",t.cssRules.length);this.target=t.cssRules[e].style}}},Yt=class{constructor(t){this.store=new Map,this.target=null;let e=t.$fastController;this.style=document.createElement("style"),e.addStyles(this.style),g.getNotifier(e).subscribe(this,"isConnected"),this.handleChange(e,"isConnected")}targetChanged(){if(this.target!==null)for(let[t,e]of this.store.entries())this.target.setProperty(t,e)}setProperty(t,e){this.store.set(t,e),p.queueUpdate(()=>{this.target!==null&&this.target.setProperty(t,e)})}removeProperty(t){this.store.delete(t),p.queueUpdate(()=>{this.target!==null&&this.target.removeProperty(t)})}handleChange(t,e){let{sheet:o}=this.style;if(o){let n=o.insertRule(":host{}",o.cssRules.length);this.target=o.cssRules[n].style}else this.target=null}};c([x],Yt.prototype,"target",void 0);var Me=class{constructor(t){this.target=t.style}setProperty(t,e){p.queueUpdate(()=>this.target.setProperty(t,e))}removeProperty(t){p.queueUpdate(()=>this.target.removeProperty(t))}},Q=class r{setProperty(t,e){r.properties[t]=e;for(let o of r.roots.values())ot.getOrCreate(r.normalizeRoot(o)).setProperty(t,e)}removeProperty(t){delete r.properties[t];for(let e of r.roots.values())ot.getOrCreate(r.normalizeRoot(e)).removeProperty(t)}static registerRoot(t){let{roots:e}=r;if(!e.has(t)){e.add(t);let o=ot.getOrCreate(this.normalizeRoot(t));for(let n in r.properties)o.setProperty(n,r.properties[n])}}static unregisterRoot(t){let{roots:e}=r;if(e.has(t)){e.delete(t);let o=ot.getOrCreate(r.normalizeRoot(t));for(let n in r.properties)o.removeProperty(n)}}static normalizeRoot(t){return t===N?document:t}};Q.roots=new Set;Q.properties={};var _e=new WeakMap,Xo=p.supportsAdoptedStyleSheets?Be:Yt,ot=Object.freeze({getOrCreate(r){if(_e.has(r))return _e.get(r);let t;return r===N?t=new Q:r instanceof Document?t=p.supportsAdoptedStyleSheets?new Fe:new Ie:Jo(r)?t=new Xo(r):t=new Me(r),_e.set(r,t),t}});var B=class r extends Z{constructor(t){super(),this.subscribers=new WeakMap,this._appliedTo=new Set,this.name=t.name,t.cssCustomPropertyName!==null&&(this.cssCustomProperty=`--${t.cssCustomPropertyName}`,this.cssVar=`var(${this.cssCustomProperty})`),this.id=r.uniqueId(),r.tokensById.set(this.id,this)}get appliedTo(){return[...this._appliedTo]}static from(t){return new r({name:typeof t=="string"?t:t.name,cssCustomPropertyName:typeof t=="string"?t:t.cssCustomPropertyName===void 0?t.name:t.cssCustomPropertyName})}static isCSSDesignToken(t){return typeof t.cssCustomProperty=="string"}static isDerivedDesignTokenValue(t){return typeof t=="function"}static getTokenById(t){return r.tokensById.get(t)}getOrCreateSubscriberSet(t=this){return this.subscribers.get(t)||this.subscribers.set(t,new Set)&&this.subscribers.get(t)}createCSS(){return this.cssVar||""}getValueFor(t){let e=$.getOrCreate(t).get(this);if(e!==void 0)return e;throw new Error(`Value could not be retrieved for token named "${this.name}". Ensure the value is set for ${t} or an ancestor of ${t}.`)}setValueFor(t,e){return this._appliedTo.add(t),e instanceof r&&(e=this.alias(e)),$.getOrCreate(t).set(this,e),this}deleteValueFor(t){return this._appliedTo.delete(t),$.existsFor(t)&&$.getOrCreate(t).delete(this),this}withDefault(t){return this.setValueFor(N,t),this}subscribe(t,e){let o=this.getOrCreateSubscriberSet(e);e&&!$.existsFor(e)&&$.getOrCreate(e),o.has(t)||o.add(t)}unsubscribe(t,e){let o=this.subscribers.get(e||this);o&&o.has(t)&&o.delete(t)}notify(t){let e=Object.freeze({token:this,target:t});this.subscribers.has(this)&&this.subscribers.get(this).forEach(o=>o.handleChange(e)),this.subscribers.has(t)&&this.subscribers.get(t).forEach(o=>o.handleChange(e))}alias(t){return e=>t.getValueFor(e)}};B.uniqueId=(()=>{let r=0;return()=>(r++,r.toString(16))})();B.tokensById=new Map;var Le=class{startReflection(t,e){t.subscribe(this,e),this.handleChange({token:t,target:e})}stopReflection(t,e){t.unsubscribe(this,e),this.remove(t,e)}handleChange(t){let{token:e,target:o}=t;this.add(e,o)}add(t,e){ot.getOrCreate(e).setProperty(t.cssCustomProperty,this.resolveCSSValue($.getOrCreate(e).get(t)))}remove(t,e){ot.getOrCreate(e).removeProperty(t.cssCustomProperty)}resolveCSSValue(t){return t&&typeof t.createCSS=="function"?t.createCSS():t}},Ne=class{constructor(t,e,o){this.source=t,this.token=e,this.node=o,this.dependencies=new Set,this.observer=g.binding(t,this,!1),this.observer.handleChange=this.observer.call,this.handleChange()}disconnect(){this.observer.disconnect()}handleChange(){this.node.store.set(this.token,this.observer.observe(this.node.target,U))}},je=class{constructor(){this.values=new Map}set(t,e){this.values.get(t)!==e&&(this.values.set(t,e),g.getNotifier(this).notify(t.id))}get(t){return g.track(this,t.id),this.values.get(t)}delete(t){this.values.delete(t)}all(){return this.values.entries()}},Ot=new WeakMap,Rt=new WeakMap,$=class r{constructor(t){this.target=t,this.store=new je,this.children=[],this.assignedValues=new Map,this.reflecting=new Set,this.bindingObservers=new Map,this.tokenValueChangeHandler={handleChange:(e,o)=>{let n=B.getTokenById(o);n&&(n.notify(this.target),this.updateCSSTokenReflection(e,n))}},Ot.set(t,this),g.getNotifier(this.store).subscribe(this.tokenValueChangeHandler),t instanceof W?t.$fastController.addBehaviors([this]):t.isConnected&&this.bind()}static getOrCreate(t){return Ot.get(t)||new r(t)}static existsFor(t){return Ot.has(t)}static findParent(t){if(N!==t.target){let e=Tt(t.target);for(;e!==null;){if(Ot.has(e))return Ot.get(e);e=Tt(e)}return r.getOrCreate(N)}return null}static findClosestAssignedNode(t,e){let o=e;do{if(o.has(t))return o;o=o.parent?o.parent:o.target!==N?r.getOrCreate(N):null}while(o!==null);return null}get parent(){return Rt.get(this)||null}updateCSSTokenReflection(t,e){if(B.isCSSDesignToken(e)){let o=this.parent,n=this.isReflecting(e);if(o){let i=o.get(e),s=t.get(e);i!==s&&!n?this.reflectToCSS(e):i===s&&n&&this.stopReflectToCSS(e)}else n||this.reflectToCSS(e)}}has(t){return this.assignedValues.has(t)}get(t){let e=this.store.get(t);if(e!==void 0)return e;let o=this.getRaw(t);if(o!==void 0)return this.hydrate(t,o),this.get(t)}getRaw(t){var e;return this.assignedValues.has(t)?this.assignedValues.get(t):(e=r.findClosestAssignedNode(t,this))===null||e===void 0?void 0:e.getRaw(t)}set(t,e){B.isDerivedDesignTokenValue(this.assignedValues.get(t))&&this.tearDownBindingObserver(t),this.assignedValues.set(t,e),B.isDerivedDesignTokenValue(e)?this.setupBindingObserver(t,e):this.store.set(t,e)}delete(t){this.assignedValues.delete(t),this.tearDownBindingObserver(t);let e=this.getRaw(t);e?this.hydrate(t,e):this.store.delete(t)}bind(){let t=r.findParent(this);t&&t.appendChild(this);for(let e of this.assignedValues.keys())e.notify(this.target)}unbind(){this.parent&&Rt.get(this).removeChild(this)}appendChild(t){t.parent&&Rt.get(t).removeChild(t);let e=this.children.filter(o=>t.contains(o));Rt.set(t,this),this.children.push(t),e.forEach(o=>t.appendChild(o)),g.getNotifier(this.store).subscribe(t);for(let[o,n]of this.store.all())t.hydrate(o,this.bindingObservers.has(o)?this.getRaw(o):n)}removeChild(t){let e=this.children.indexOf(t);return e!==-1&&this.children.splice(e,1),g.getNotifier(this.store).unsubscribe(t),t.parent===this?Rt.delete(t):!1}contains(t){return qr(this.target,t.target)}reflectToCSS(t){this.isReflecting(t)||(this.reflecting.add(t),r.cssCustomPropertyReflector.startReflection(t,this.target))}stopReflectToCSS(t){this.isReflecting(t)&&(this.reflecting.delete(t),r.cssCustomPropertyReflector.stopReflection(t,this.target))}isReflecting(t){return this.reflecting.has(t)}handleChange(t,e){let o=B.getTokenById(e);o&&(this.hydrate(o,this.getRaw(o)),this.updateCSSTokenReflection(this.store,o))}hydrate(t,e){if(!this.has(t)){let o=this.bindingObservers.get(t);B.isDerivedDesignTokenValue(e)?o?o.source!==e&&(this.tearDownBindingObserver(t),this.setupBindingObserver(t,e)):this.setupBindingObserver(t,e):(o&&this.tearDownBindingObserver(t),this.store.set(t,e))}}setupBindingObserver(t,e){let o=new Ne(e,t,this);return this.bindingObservers.set(t,o),o}tearDownBindingObserver(t){return this.bindingObservers.has(t)?(this.bindingObservers.get(t).disconnect(),this.bindingObservers.delete(t),!0):!1}};$.cssCustomPropertyReflector=new Le;c([x],$.prototype,"children",void 0);function Yo(r){return B.from(r)}var Et=Object.freeze({create:Yo,notifyConnection(r){return!r.isConnected||!$.existsFor(r)?!1:($.getOrCreate(r).bind(),!0)},notifyDisconnection(r){return r.isConnected||!$.existsFor(r)?!1:($.getOrCreate(r).unbind(),!0)},registerRoot(r=N){Q.registerRoot(r)},unregisterRoot(r=N){Q.unregisterRoot(r)}});var Ve=Object.freeze({definitionCallbackOnly:null,ignoreDuplicate:Symbol()}),He=new Map,Zt=new Map,mt=null,At=b.createInterface(r=>r.cachedCallback(t=>(mt===null&&(mt=new Kt(null,t)),mt))),qe=Object.freeze({tagFor(r){return Zt.get(r)},responsibleFor(r){let t=r.$$designSystem$$;return t||b.findResponsibleContainer(r).get(At)},getOrCreate(r){if(!r)return mt===null&&(mt=b.getOrCreateDOMContainer().get(At)),mt;let t=r.$$designSystem$$;if(t)return t;let e=b.getOrCreateDOMContainer(r);if(e.has(At,!1))return e.get(At);{let o=new Kt(r,e);return e.register(K.instance(At,o)),o}}});function Zo(r,t,e){return typeof r=="string"?{name:r,type:t,callback:e}:r}var Kt=class{constructor(t,e){this.owner=t,this.container=e,this.designTokensInitialized=!1,this.prefix="fast",this.shadowRootMode=void 0,this.disambiguate=()=>Ve.definitionCallbackOnly,t!==null&&(t.$$designSystem$$=this)}withPrefix(t){return this.prefix=t,this}withShadowRootMode(t){return this.shadowRootMode=t,this}withElementDisambiguation(t){return this.disambiguate=t,this}withDesignTokenRoot(t){return this.designTokenRoot=t,this}register(...t){let e=this.container,o=[],n=this.disambiguate,i=this.shadowRootMode,s={elementPrefix:this.prefix,tryDefineElement(a,u,l){let f=Zo(a,u,l),{name:m,callback:w,baseClass:M}=f,{type:C}=f,A=m,Bt=He.get(A),ae=!0;for(;Bt;){let or=n(A,C,Bt);switch(or){case Ve.ignoreDuplicate:return;case Ve.definitionCallbackOnly:ae=!1,Bt=void 0;break;default:A=or,Bt=He.get(A);break}}ae&&((Zt.has(C)||C===T)&&(C=class extends C{}),He.set(A,C),Zt.set(C,A),M&&Zt.set(M,A)),o.push(new ze(e,A,C,i,w,ae))}};this.designTokensInitialized||(this.designTokensInitialized=!0,this.designTokenRoot!==null&&Et.registerRoot(this.designTokenRoot)),e.registerWithContext(s,...t);for(let a of o)a.callback(a),a.willDefine&&a.definition!==null&&a.definition.define();return this}},ze=class{constructor(t,e,o,n,i,s){this.container=t,this.name=e,this.type=o,this.shadowRootMode=n,this.callback=i,this.willDefine=s,this.definition=null}definePresentation(t){Qt.define(this.name,t,this.container)}defineElement(t){this.definition=new L(this.type,Object.assign(Object.assign({},t),{name:this.name}))}tagFor(t){return qe.tagFor(t)}};var Ue=class extends T{},te=class extends et(Ue){constructor(){super(...arguments),this.proxy=document.createElement("input")}};var Ur={email:"email",password:"password",tel:"tel",text:"text",url:"url"};var O=class extends te{constructor(){super(...arguments),this.type=Ur.text}readOnlyChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.readOnly=this.readOnly,this.validate())}autofocusChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.autofocus=this.autofocus,this.validate())}placeholderChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.placeholder=this.placeholder)}typeChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.type=this.type,this.validate())}listChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.setAttribute("list",this.list),this.validate())}maxlengthChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.maxLength=this.maxlength,this.validate())}minlengthChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.minLength=this.minlength,this.validate())}patternChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.pattern=this.pattern,this.validate())}sizeChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.size=this.size)}spellcheckChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.spellcheck=this.spellcheck)}connectedCallback(){super.connectedCallback(),this.proxy.setAttribute("type",this.type),this.validate(),this.autofocus&&p.queueUpdate(()=>{this.focus()})}select(){this.control.select(),this.$emit("select")}handleTextInput(){this.value=this.control.value}handleChange(){this.$emit("change")}validate(){super.validate(this.control)}};c([h({attribute:"readonly",mode:"boolean"})],O.prototype,"readOnly",void 0);c([h({mode:"boolean"})],O.prototype,"autofocus",void 0);c([h],O.prototype,"placeholder",void 0);c([h],O.prototype,"type",void 0);c([h],O.prototype,"list",void 0);c([h({converter:V})],O.prototype,"maxlength",void 0);c([h({converter:V})],O.prototype,"minlength",void 0);c([h],O.prototype,"pattern",void 0);c([h({converter:V})],O.prototype,"size",void 0);c([h({mode:"boolean"})],O.prototype,"spellcheck",void 0);c([x],O.prototype,"defaultSlottedNodes",void 0);var bt=class{};G(bt,y);G(O,ft,bt);var We=class extends T{},ee=class extends et(We){constructor(){super(...arguments),this.proxy=document.createElement("textarea")}};var Dt={none:"none",both:"both",horizontal:"horizontal",vertical:"vertical"};var k=class extends ee{constructor(){super(...arguments),this.resize=Dt.none,this.cols=20,this.handleTextInput=()=>{this.value=this.control.value}}readOnlyChanged(){this.proxy instanceof HTMLTextAreaElement&&(this.proxy.readOnly=this.readOnly)}autofocusChanged(){this.proxy instanceof HTMLTextAreaElement&&(this.proxy.autofocus=this.autofocus)}listChanged(){this.proxy instanceof HTMLTextAreaElement&&this.proxy.setAttribute("list",this.list)}maxlengthChanged(){this.proxy instanceof HTMLTextAreaElement&&(this.proxy.maxLength=this.maxlength)}minlengthChanged(){this.proxy instanceof HTMLTextAreaElement&&(this.proxy.minLength=this.minlength)}spellcheckChanged(){this.proxy instanceof HTMLTextAreaElement&&(this.proxy.spellcheck=this.spellcheck)}select(){this.control.select(),this.$emit("select")}handleChange(){this.$emit("change")}validate(){super.validate(this.control)}};c([h({mode:"boolean"})],k.prototype,"readOnly",void 0);c([h],k.prototype,"resize",void 0);c([h({mode:"boolean"})],k.prototype,"autofocus",void 0);c([h({attribute:"form"})],k.prototype,"formId",void 0);c([h],k.prototype,"list",void 0);c([h({converter:V})],k.prototype,"maxlength",void 0);c([h({converter:V})],k.prototype,"minlength",void 0);c([h],k.prototype,"name",void 0);c([h],k.prototype,"placeholder",void 0);c([h({converter:V,mode:"fromView"})],k.prototype,"cols",void 0);c([h({converter:V,mode:"fromView"})],k.prototype,"rows",void 0);c([h({mode:"boolean"})],k.prototype,"spellcheck",void 0);c([x],k.prototype,"defaultSlottedNodes",void 0);G(k,bt);var Wr=(r,t)=>D`
    <template
        class="
            ${e=>e.readOnly?"readonly":""}
            ${e=>e.resize!==Dt.none?`resize-${e.resize}`:""}"
    >
        <label
            part="label"
            for="control"
            class="${e=>e.defaultSlottedNodes&&e.defaultSlottedNodes.length?"label":"label label__hidden"}"
        >
            <slot ${ht("defaultSlottedNodes")}></slot>
        </label>
        <textarea
            part="control"
            class="control"
            id="control"
            ?autofocus="${e=>e.autofocus}"
            cols="${e=>e.cols}"
            ?disabled="${e=>e.disabled}"
            form="${e=>e.form}"
            list="${e=>e.list}"
            maxlength="${e=>e.maxlength}"
            minlength="${e=>e.minlength}"
            name="${e=>e.name}"
            placeholder="${e=>e.placeholder}"
            ?readonly="${e=>e.readOnly}"
            ?required="${e=>e.required}"
            rows="${e=>e.rows}"
            ?spellcheck="${e=>e.spellcheck}"
            :value="${e=>e.value}"
            aria-atomic="${e=>e.ariaAtomic}"
            aria-busy="${e=>e.ariaBusy}"
            aria-controls="${e=>e.ariaControls}"
            aria-current="${e=>e.ariaCurrent}"
            aria-describedby="${e=>e.ariaDescribedby}"
            aria-details="${e=>e.ariaDetails}"
            aria-disabled="${e=>e.ariaDisabled}"
            aria-errormessage="${e=>e.ariaErrormessage}"
            aria-flowto="${e=>e.ariaFlowto}"
            aria-haspopup="${e=>e.ariaHaspopup}"
            aria-hidden="${e=>e.ariaHidden}"
            aria-invalid="${e=>e.ariaInvalid}"
            aria-keyshortcuts="${e=>e.ariaKeyshortcuts}"
            aria-label="${e=>e.ariaLabel}"
            aria-labelledby="${e=>e.ariaLabelledby}"
            aria-live="${e=>e.ariaLive}"
            aria-owns="${e=>e.ariaOwns}"
            aria-relevant="${e=>e.ariaRelevant}"
            aria-roledescription="${e=>e.ariaRoledescription}"
            @input="${(e,o)=>e.handleTextInput()}"
            @change="${e=>e.handleChange()}"
            ${E("control")}
        ></textarea>
    </template>
`;var gt="not-allowed";var Ko=":host([hidden]){display:none}";function yt(r){return`${Ko}:host{display:${r}}`}var H=_r()?"focus-visible":"focus";function Gr(r){return qe.getOrCreate(r).withPrefix("vscode")}function Jr(r){window.addEventListener("load",()=>{new MutationObserver(()=>{Qr(r)}).observe(document.body,{attributes:!0,attributeFilter:["class"]}),Qr(r)})}function Qr(r){let t=getComputedStyle(document.body),e=document.querySelector("body");if(e){let o=e.getAttribute("data-vscode-theme-kind");for(let[n,i]of r){let s=t.getPropertyValue(n).toString();if(o==="vscode-high-contrast")s.length===0&&i.name.includes("background")&&(s="transparent"),i.name==="button-icon-hover-background"&&(s="transparent");else if(o==="vscode-high-contrast-light"){if(s.length===0&&i.name.includes("background"))switch(i.name){case"button-primary-hover-background":s="#0F4A85";break;case"button-secondary-hover-background":s="transparent";break;case"button-icon-hover-background":s="transparent";break}}else i.name==="contrast-active-border"&&(s="transparent");i.setValueFor(e,s)}}}var Xr=new Map,Yr=!1;function d(r,t){let e=Et.create(r);if(t){if(t.includes("--fake-vscode-token")){let o="id"+Math.random().toString(16).slice(2);t=`${t}-${o}`}Xr.set(t,e)}return Yr||(Jr(Xr),Yr=!0),e}var _l=d("background","--vscode-editor-background").withDefault("#1e1e1e"),R=d("border-width").withDefault(1),Zr=d("contrast-active-border","--vscode-contrastActiveBorder").withDefault("#f38518"),Bl=d("contrast-border","--vscode-contrastBorder").withDefault("#6fc3df"),Fl=d("corner-radius").withDefault(0),re=d("corner-radius-round").withDefault(2),F=d("design-unit").withDefault(4),vt=d("disabled-opacity").withDefault(.4),I=d("focus-border","--vscode-focusBorder").withDefault("#007fd4"),xt=d("font-family","--vscode-font-family").withDefault("-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol"),Il=d("font-weight","--vscode-font-weight").withDefault("400"),J=d("foreground","--vscode-foreground").withDefault("#cccccc"),Ml=d("input-height").withDefault("26"),Kr=d("input-min-width").withDefault("100px"),nt=d("type-ramp-base-font-size","--vscode-font-size").withDefault("13px"),it=d("type-ramp-base-line-height").withDefault("normal"),Ll=d("type-ramp-minus1-font-size").withDefault("11px"),Nl=d("type-ramp-minus1-line-height").withDefault("16px"),jl=d("type-ramp-minus2-font-size").withDefault("9px"),Vl=d("type-ramp-minus2-line-height").withDefault("16px"),Hl=d("type-ramp-plus1-font-size").withDefault("16px"),zl=d("type-ramp-plus1-line-height").withDefault("24px"),to=d("scrollbarWidth").withDefault("10px"),eo=d("scrollbarHeight").withDefault("10px"),ro=d("scrollbar-slider-background","--vscode-scrollbarSlider-background").withDefault("#79797966"),oo=d("scrollbar-slider-hover-background","--vscode-scrollbarSlider-hoverBackground").withDefault("#646464b3"),no=d("scrollbar-slider-active-background","--vscode-scrollbarSlider-activeBackground").withDefault("#bfbfbf66"),ql=d("badge-background","--vscode-badge-background").withDefault("#4d4d4d"),Ul=d("badge-foreground","--vscode-badge-foreground").withDefault("#ffffff"),io=d("button-border","--vscode-button-border").withDefault("transparent"),Ge=d("button-icon-background").withDefault("transparent"),so=d("button-icon-corner-radius").withDefault("5px"),ao=d("button-icon-outline-offset").withDefault(0),Qe=d("button-icon-hover-background","--fake-vscode-token").withDefault("rgba(90, 93, 94, 0.31)"),lo=d("button-icon-padding").withDefault("3px"),st=d("button-primary-background","--vscode-button-background").withDefault("#0e639c"),Je=d("button-primary-foreground","--vscode-button-foreground").withDefault("#ffffff"),Xe=d("button-primary-hover-background","--vscode-button-hoverBackground").withDefault("#1177bb"),oe=d("button-secondary-background","--vscode-button-secondaryBackground").withDefault("#3a3d41"),co=d("button-secondary-foreground","--vscode-button-secondaryForeground").withDefault("#ffffff"),uo=d("button-secondary-hover-background","--vscode-button-secondaryHoverBackground").withDefault("#45494e"),ho=d("button-padding-horizontal").withDefault("11px"),fo=d("button-padding-vertical").withDefault("4px"),ne=d("checkbox-background","--vscode-checkbox-background").withDefault("#3c3c3c"),Ye=d("checkbox-border","--vscode-checkbox-border").withDefault("#3c3c3c"),po=d("checkbox-corner-radius").withDefault(3),Wl=d("checkbox-foreground","--vscode-checkbox-foreground").withDefault("#f0f0f0"),Gl=d("list-active-selection-background","--vscode-list-activeSelectionBackground").withDefault("#094771"),Ql=d("list-active-selection-foreground","--vscode-list-activeSelectionForeground").withDefault("#ffffff"),Jl=d("list-hover-background","--vscode-list-hoverBackground").withDefault("#2a2d2e"),Xl=d("divider-background","--vscode-settings-dropdownListBorder").withDefault("#454545"),Yl=d("dropdown-background","--vscode-dropdown-background").withDefault("#3c3c3c"),ie=d("dropdown-border","--vscode-dropdown-border").withDefault("#3c3c3c"),Zl=d("dropdown-foreground","--vscode-dropdown-foreground").withDefault("#f0f0f0"),Kl=d("dropdown-list-max-height").withDefault("200px"),_t=d("input-background","--vscode-input-background").withDefault("#3c3c3c"),mo=d("input-foreground","--vscode-input-foreground").withDefault("#cccccc"),tc=d("input-placeholder-foreground","--vscode-input-placeholderForeground").withDefault("#cccccc"),ec=d("link-active-foreground","--vscode-textLink-activeForeground").withDefault("#3794ff"),rc=d("link-foreground","--vscode-textLink-foreground").withDefault("#3794ff"),oc=d("progress-background","--vscode-progressBar-background").withDefault("#0e70c0"),nc=d("panel-tab-active-border","--vscode-panelTitle-activeBorder").withDefault("#e7e7e7"),ic=d("panel-tab-active-foreground","--vscode-panelTitle-activeForeground").withDefault("#e7e7e7"),sc=d("panel-tab-foreground","--vscode-panelTitle-inactiveForeground").withDefault("#e7e7e799"),ac=d("panel-view-background","--vscode-panel-background").withDefault("#1e1e1e"),lc=d("panel-view-border","--vscode-panel-border").withDefault("#80808059"),cc=d("tag-corner-radius").withDefault("2px");function bo(r,t,e,o){var n=arguments.length,i=n<3?t:o===null?o=Object.getOwnPropertyDescriptor(t,e):o,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(r,t,e,o);else for(var a=r.length-1;a>=0;a--)(s=r[a])&&(i=(n<3?s(i):n>3?s(t,e,i):s(t,e))||i);return n>3&&i&&Object.defineProperty(t,e,i),i}var tn=_`
	${yt("inline-flex")} :host {
		outline: none;
		font-family: ${xt};
		font-size: ${nt};
		line-height: ${it};
		color: ${Je};
		background: ${st};
		border-radius: calc(${re} * 1px);
		fill: currentColor;
		cursor: pointer;
	}
	.control {
		background: transparent;
		height: inherit;
		flex-grow: 1;
		box-sizing: border-box;
		display: inline-flex;
		justify-content: center;
		align-items: center;
		padding: ${fo} ${ho};
		white-space: wrap;
		outline: none;
		text-decoration: none;
		border: calc(${R} * 1px) solid ${io};
		color: inherit;
		border-radius: inherit;
		fill: inherit;
		cursor: inherit;
		font-family: inherit;
	}
	:host(:hover) {
		background: ${Xe};
	}
	:host(:active) {
		background: ${st};
	}
	.control:${H} {
		outline: calc(${R} * 1px) solid ${I};
		outline-offset: calc(${R} * 2px);
	}
	.control::-moz-focus-inner {
		border: 0;
	}
	:host([disabled]) {
		opacity: ${vt};
		background: ${st};
		cursor: ${gt};
	}
	.content {
		display: flex;
	}
	.start {
		display: flex;
	}
	::slotted(svg),
	::slotted(span) {
		width: calc(${F} * 4px);
		height: calc(${F} * 4px);
	}
	.start {
		margin-inline-end: 8px;
	}
`,en=_`
	:host([appearance='primary']) {
		background: ${st};
		color: ${Je};
	}
	:host([appearance='primary']:hover) {
		background: ${Xe};
	}
	:host([appearance='primary']:active) .control:active {
		background: ${st};
	}
	:host([appearance='primary']) .control:${H} {
		outline: calc(${R} * 1px) solid ${I};
		outline-offset: calc(${R} * 2px);
	}
	:host([appearance='primary'][disabled]) {
		background: ${st};
	}
`,rn=_`
	:host([appearance='secondary']) {
		background: ${oe};
		color: ${co};
	}
	:host([appearance='secondary']:hover) {
		background: ${uo};
	}
	:host([appearance='secondary']:active) .control:active {
		background: ${oe};
	}
	:host([appearance='secondary']) .control:${H} {
		outline: calc(${R} * 1px) solid ${I};
		outline-offset: calc(${R} * 2px);
	}
	:host([appearance='secondary'][disabled]) {
		background: ${oe};
	}
`,on=_`
	:host([appearance='icon']) {
		background: ${Ge};
		border-radius: ${so};
		color: ${J};
	}
	:host([appearance='icon']:hover) {
		background: ${Qe};
		outline: 1px dotted ${Zr};
		outline-offset: -1px;
	}
	:host([appearance='icon']) .control {
		padding: ${lo};
		border: none;
	}
	:host([appearance='icon']:active) .control:active {
		background: ${Qe};
	}
	:host([appearance='icon']) .control:${H} {
		outline: calc(${R} * 1px) solid ${I};
		outline-offset: ${ao};
	}
	:host([appearance='icon'][disabled]) {
		background: ${Ge};
	}
`,go=(r,t)=>_`
	${tn}
	${en}
	${rn}
	${on}
`;var se=class extends P{connectedCallback(){if(super.connectedCallback(),!this.appearance){let t=this.getAttribute("appearance");this.appearance=t}}attributeChangedCallback(t,e,o){t==="appearance"&&o==="icon"&&(this.getAttribute("aria-label")||(this.ariaLabel="Icon Button")),t==="aria-label"&&(this.ariaLabel=o),t==="disabled"&&(this.disabled=o!==null)}};bo([h],se.prototype,"appearance",void 0);var Ze=se.compose({baseName:"button",template:Mr,styles:go,shadowOptions:{delegatesFocus:!0}});var yo=(r,t)=>_`
	${yt("inline-flex")} :host {
		align-items: center;
		outline: none;
		margin: calc(${F} * 1px) 0;
		user-select: none;
		font-size: ${nt};
		line-height: ${it};
	}
	.control {
		position: relative;
		width: calc(${F} * 4px + 2px);
		height: calc(${F} * 4px + 2px);
		box-sizing: border-box;
		border-radius: calc(${po} * 1px);
		border: calc(${R} * 1px) solid ${Ye};
		background: ${ne};
		outline: none;
		cursor: pointer;
	}
	.label {
		font-family: ${xt};
		color: ${J};
		padding-inline-start: calc(${F} * 2px + 2px);
		margin-inline-end: calc(${F} * 2px + 2px);
		cursor: pointer;
	}
	.label__hidden {
		display: none;
		visibility: hidden;
	}
	.checked-indicator {
		width: 100%;
		height: 100%;
		display: block;
		fill: ${J};
		opacity: 0;
		pointer-events: none;
	}
	.indeterminate-indicator {
		border-radius: 2px;
		background: ${J};
		position: absolute;
		top: 50%;
		left: 50%;
		width: 50%;
		height: 50%;
		transform: translate(-50%, -50%);
		opacity: 0;
	}
	:host(:enabled) .control:hover {
		background: ${ne};
		border-color: ${Ye};
	}
	:host(:enabled) .control:active {
		background: ${ne};
		border-color: ${I};
	}
	:host(:${H}) .control {
		border: calc(${R} * 1px) solid ${I};
	}
	:host(.disabled) .label,
	:host(.readonly) .label,
	:host(.readonly) .control,
	:host(.disabled) .control {
		cursor: ${gt};
	}
	:host(.checked:not(.indeterminate)) .checked-indicator,
	:host(.indeterminate) .indeterminate-indicator {
		opacity: 1;
	}
	:host(.disabled) {
		opacity: ${vt};
	}
`;var Ke=class extends rt{connectedCallback(){super.connectedCallback(),this.textContent?this.setAttribute("aria-label",this.textContent):this.setAttribute("aria-label","Checkbox")}},tr=Ke.compose({baseName:"checkbox",template:zr,styles:yo,checkedIndicator:`
		<svg 
			part="checked-indicator"
			class="checked-indicator"
			width="16" 
			height="16" 
			viewBox="0 0 16 16" 
			xmlns="http://www.w3.org/2000/svg" 
			fill="currentColor"
		>
			<path 
				fill-rule="evenodd" 
				clip-rule="evenodd" 
				d="M14.431 3.323l-8.47 10-.79-.036-3.35-4.77.818-.574 2.978 4.24 8.051-9.506.764.646z"
			/>
		</svg>
	`,indeterminateIndicator:`
		<div part="indeterminate-indicator" class="indeterminate-indicator"></div>
	`});var vo=(r,t)=>_`
	${yt("inline-block")} :host {
		font-family: ${xt};
		outline: none;
		user-select: none;
	}
	.control {
		box-sizing: border-box;
		position: relative;
		color: ${mo};
		background: ${_t};
		border-radius: calc(${re} * 1px);
		border: calc(${R} * 1px) solid ${ie};
		font: inherit;
		font-size: ${nt};
		line-height: ${it};
		padding: calc(${F} * 2px + 1px);
		width: 100%;
		min-width: ${Kr};
		resize: none;
	}
	.control:hover:enabled {
		background: ${_t};
		border-color: ${ie};
	}
	.control:active:enabled {
		background: ${_t};
		border-color: ${I};
	}
	.control:hover,
	.control:${H},
	.control:disabled,
	.control:active {
		outline: none;
	}
	.control::-webkit-scrollbar {
		width: ${to};
		height: ${eo};
	}
	.control::-webkit-scrollbar-corner {
		background: ${_t};
	}
	.control::-webkit-scrollbar-thumb {
		background: ${ro};
	}
	.control::-webkit-scrollbar-thumb:hover {
		background: ${oo};
	}
	.control::-webkit-scrollbar-thumb:active {
		background: ${no};
	}
	:host(:focus-within:not([disabled])) .control {
		border-color: ${I};
	}
	:host([resize='both']) .control {
		resize: both;
	}
	:host([resize='horizontal']) .control {
		resize: horizontal;
	}
	:host([resize='vertical']) .control {
		resize: vertical;
	}
	.label {
		display: block;
		color: ${J};
		cursor: pointer;
		font-size: ${nt};
		line-height: ${it};
		margin-bottom: 2px;
	}
	.label__hidden {
		display: none;
		visibility: hidden;
	}
	:host([disabled]) .label,
	:host([readonly]) .label,
	:host([readonly]) .control,
	:host([disabled]) .control {
		cursor: ${gt};
	}
	:host([disabled]) {
		opacity: ${vt};
	}
	:host([disabled]) .control {
		border-color: ${ie};
	}
`;var er=class extends k{connectedCallback(){super.connectedCallback(),this.textContent?this.setAttribute("aria-label",this.textContent):this.setAttribute("aria-label","Text area")}},rr=er.compose({baseName:"text-area",template:Wr,styles:vo,shadowOptions:{delegatesFocus:!0}});Gr().register(Ze(),tr(),rr());
/*! Bundled license information:

tslib/tslib.es6.js:
  (*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** *)
*/
