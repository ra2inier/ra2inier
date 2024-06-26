<script lang="ts" setup>
import { ref } from 'vue';
import { useConfigStore } from '@/stores/config';
import { useLayoutState } from '@/states/layout';
import { useCtxMenuState } from '@/states/ctxMenu';


const layout = useLayoutState()
const { leftTabSize, footTabSize } = layout

//左侧拖拽逻辑
const display = ref(false)
const { config } = useConfigStore()

function onSideDrag(e: MouseEvent) {
   if (e.clientX < 140) {
      return leftTabSize.close()
   }
   leftTabSize.width = e.clientX
}

//右侧下边栏逻辑
const display2 = ref(false)
function onFootDragStart() {
   display2.value = true
   setTimeout(() => footTabSize.active = true)
}

function onFootDrag(e: MouseEvent) {
   // @ts-ignore
   const tmp = e.target.offsetParent, x = tmp.clientHeight - e.layerY
   if (isNaN(x)) return
   if (x < 100) footTabSize.min()
   else footTabSize.height = x
}

function onFootDargEnd() {
   display2.value = false
   if (footTabSize.height > 20) footTabSize.emit('resized')
}

// 右键菜单逻辑
// 等待修改
const ctxmenu = useCtxMenuState()
const { vCtxRoot } = ctxmenu

</script>

<template>
   <div id="home" :class="[$style.home]" :GPU="config.GPU" v-ctx-root>
      <!-- 顶部内容 -->
      <header>
         <div v-show="!layout.isMasked">
            <slot name="header"></slot>
         </div>
      </header>

      <!-- 中间内容 -->
      <section>
         <!-- 左侧边 -->
         <aside :style="leftTabSize.widthS">
            <slot name="leftSide"></slot>
            <div :class="[$style.drager1, $theme['drager-hover']]">
               <p @mousedown="display = true"></p>
               <b v-show="display" @mousemove="onSideDrag" @mouseup="display = false" @mouseleave="display = false"></b>
            </div>
         </aside>
         <!-- 右侧主要内容区域 -->
         <main :class="$theme.panel">
            <!-- 右下边栏 -->
            <aside :style="footTabSize.heightS" :class="[footTabSize.canHidden || $style['foottab-size']]">
               <slot name="footSide"></slot>
               <div :class="[$style.drager2, $theme['drager-hover']]" :dragging="display2">
                  <p @mousedown="onFootDragStart"></p>
               </div>
            </aside>
            <b :class="$style['drager2-panel']" v-show="display2" @mousemove="onFootDrag" @mouseleave="onFootDargEnd"
               @mouseup="onFootDargEnd"></b>
            <!-- 面板主体 -->
            <article id="main">
               <slot name="main"></slot>
            </article>
         </main>
      </section>

      <!-- 底部内容 -->
      <footer>
         <slot name="footer"></slot>
      </footer>
   </div>
</template>

<style scoped src="@css/panel.scss" module="$theme" />
<style scoped lang="scss" module>
$header-height: layout-size(menu);
$footer-height: layout-size(footer);

.home {
   display: flex;
   flex-direction: column;
   width: 100%;
   height: 100vh;
   min-height: 0;
   overflow: hidden;

   >header {
      position: relative;
      @include z-index(menu);
      flex: 0 0 $header-height;

      >div {
         height: 100%;
      }
   }

   >legend {
      position: relative;
      @include z-index(ctxmenu);
      flex: 0 0 0px;
      min-height: 0;
      overflow: visible;

      >div {
         position: relative;
         height: 0;
         overflow: visible;
      }
   }

   @import './section.scss';

   >footer {
      position: relative;
      @include z-index(footer);
      flex: 0 0 $footer-height;
   }
}

.foottab-size {
   min-height: layout-size(foottab);
}

@import './drager.scss';
</style>
