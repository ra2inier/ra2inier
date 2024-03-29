<script lang='ts' setup>
import { computed, inject, ref, Ref } from 'vue';

import playSvg from '@/asset/icons/compile.svg?raw';
import openDirSvg from '@/asset/icons/openDir.svg?raw';
import { FootTabType, useFootSelect } from '@/states/footTabList';
import { useConfigStore } from '@/stores/config';
import { build } from '@/stores/projectStore';
import { FlexInput, LazyButton } from '@ra2inier/wc';
import { openDirectory } from '@/boot/file';

defineOptions({ name: 'Output' })
const { config, set } = useConfigStore()

function onOutputClick() {
   build()
}

const outDir = computed({
   get() { return config.OUTPUT_DIR ?? "" },
   set(val: string) { set('OUTPUT_DIR', val) }
})

async function onOpenPathClick() {
   const path = await openDirectory()
   path && (outDir.value = path[0])
}

// foottab的自定义按钮逻辑
const { selected } = useFootSelect()
const mounted = <Ref<boolean>>inject('foottab-mounted')
</script>


<template>
   <div class="scroll" :class="$style.output">
      <li>
         <span>输出</span><span>::</span>
         <lazy-button class="fore-button" @click="onOutputClick">
            <s v-svgicon="playSvg" padding=" 15%"></s>
         </lazy-button>
      </li>
      <li>
         <span>输出目录</span><span>::</span>
         <flex-input class="rd ol-n" :value="outDir" :placeholder="outDir"></flex-input>
         <lazy-button class="fore-button" @click="onOpenPathClick">
            <s v-svgicon="openDirSvg" padding="15%"></s>
         </lazy-button>
      </li>
   </div>
   <Teleport v-if="mounted" to="#foottab-tools" :disabled="selected.type !== FootTabType.Output">
      <lazy-button class="fore-button" :class="$style['icon-margin']" @click="onOutputClick">
         <s v-svgicon="playSvg"></s>
      </lazy-button>
   </Teleport>
</template>

<style scoped lang='scss' module>
$height: line-height(normal);

.output {
   padding: align-size(large) 0;

   li {
      display: flex;
      align-items: center;
      height: $height;
      line-height: $height;
      padding: 0 align-size(large);

      span {
         float: left;
         height: $height;
      }
   }

   flex-input {
      height: 100%;
      line-height: 100%;
      padding: 0 align-size(normal);
   }

   s {
      height: 100%;
      aspect-ratio: 1;
   }
}


.icon-margin {
   margin: 0 align-size(tiny);
}
</style>
