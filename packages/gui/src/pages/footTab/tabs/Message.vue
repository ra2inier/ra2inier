<script lang='ts' setup>
import { FootTabType, useFoottabState } from '@/states/footTabList';
import { Ref, computed, inject, reactive, shallowReactive } from 'vue';
import clearSvg from '@/asset/icons/clear.svg?raw';
import forbidSvg from '@/asset/icons/forbid.svg?raw';
import rightSvg from '@/asset/icons/right.svg?raw';
import { useMessageStore } from '@/stores/messageStore'
import { useFolder } from '@/hooks/folder';

defineOptions({ name: 'Message' })
const foottab = useFoottabState()
const message = useMessageStore()
const foldedMap = computed(() => shallowReactive(message.messageList.map(x => true)))

foottab.setMessageBadge(message.messageList.length)

const mounted = <Ref<boolean>>inject('foottab-mounted')

function onClearClick() {
	message.clearAll()
	foottab.setMessageBadge(0)
}

function onReadClick() {
	message.readAll()
	foottab.setMessageBadge(0)
}

const { vFolder } = useFolder((_, value) => {
	for (const key in foldedMap.value) {
		foldedMap.value[key] = !value
	}
}, false)
</script>


<template>
	<div class="scroll list-view" :class="[$style.message, $theme.message]">
		<li v-for="(msg, id) in message.messageList" :key="msg.id">
			<h2>
				<i :read="msg.read">[{{ msg.time }}]</i>
				<i style="width: 1ch;"></i>
				<b>{{ msg.sender }}</b>
			</h2>
			<div :level="msg.level" class="round">
				<span class="folder" v-if="msg.remark" :folded="!foldedMap[id]"
					@click="foldedMap[id] = !foldedMap[id]">&gt;</span>
				<span @click="foldedMap[id] = !foldedMap[id]">{{ msg.content }}</span>
			</div>
			<pre v-if="msg.remark" :level="msg.level" v-show="foldedMap[id]">{{ msg.remark }}</pre>
		</li>
	</div>
	<Teleport v-if="mounted" to="#foottab-tools" :disabled="foottab.selected.type !== FootTabType.Message">
		<s title="折叠消息" v-folder v-svgicon="rightSvg" class="fore-button" :class="$style['icon-margin']" padding="10%"
			style="height: 100%;"></s>
		<lazy-button class="fore-button" :class="$style['icon-margin']" @click="onReadClick">
			<s title="已读" v-svgicon="forbidSvg" padding="15%"></s>
		</lazy-button>
		<i style="min-width: 1em;"></i>
		<lazy-button class="fore-button" :class="$style['icon-margin']" @click="onClearClick">
			<s title="清空" v-svgicon="clearSvg" padding="5%"></s>
		</lazy-button>
	</Teleport>
</template>

<style scoped src="@css/foottab-message.scss" module="$theme" />
<style scoped lang='scss' module>
$align: align-size(normal);

.message {
	overflow: auto;
	height: 100%;
	padding: $align 0;
	@include font-size(normal);
	line-height: line-height(small);

	li {
		padding: 0 $align;
	}

	b {
		position: relative;
	}

	b::after {
		content: '';
		position: absolute;
		top: 50%;
		right: -$align;
		height: 1ch;
		transform: translateY(-50%);
		aspect-ratio: 1;
		border-radius: 50%;
	}

	div {
		width: fit-content;
		padding: 0 $align;
		font-weight: 900;
		background: color-mix(in srgb, currentColor 24%, transparent);
	}

	h2 {
		@include font-size(small);
	}

	pre {
		@include font-size(small);
		text-wrap: wrap;
		padding: 0 $align;
	}

	i {
		display: inline-block
	}
}

.icon-margin {
	margin: 0 align-size(tiny);
	height: 100%;
	aspect-ratio: 1;
}
</style>
