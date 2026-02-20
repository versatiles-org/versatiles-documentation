<script setup lang="ts">
import { ref, computed } from 'vue';
import { data } from '../../../compendium/showcases.data';

const selectedCountry = ref<string | null>(null);
const selectedTags = ref<Set<string>>(new Set());

function toggleCountry(country: string) {
	selectedCountry.value = selectedCountry.value === country ? null : country;
}

function toggleTag(tag: string) {
	const next = new Set(selectedTags.value);
	if (next.has(tag)) next.delete(tag);
	else next.add(tag);
	selectedTags.value = next;
}

function clearFilters() {
	selectedCountry.value = null;
	selectedTags.value = new Set();
}

const hasFilters = computed(() => selectedCountry.value !== null || selectedTags.value.size > 0);

const filtered = computed(() =>
	data.showcases.filter((s) => {
		if (selectedCountry.value && s.country !== selectedCountry.value) return false;
		if (selectedTags.value.size > 0 && !s.tags.some((t) => selectedTags.value.has(t)))
			return false;
		return true;
	}),
);

function formatTag(tag: string) {
	return tag.replace(/-/g, ' ');
}

function domain(url: string) {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return url;
	}
}
</script>

<template>
	<div class="showcases">
		<div v-if="data.countries.length > 1" class="filters">
			<div class="filter-group">
				<span class="filter-label">Country</span>
				<button
					v-for="country in data.countries"
					:key="country"
					:class="['pill', { active: selectedCountry === country }]"
					@click="toggleCountry(country)"
				>
					{{ country }}
				</button>
			</div>
			<div class="filter-group">
				<span class="filter-label">Tags</span>
				<button
					v-for="tag in data.tags"
					:key="tag"
					:class="['pill', 'tag-pill', { active: selectedTags.has(tag) }]"
					@click="toggleTag(tag)"
				>
					{{ formatTag(tag) }}
				</button>
			</div>
			<button v-if="hasFilters" class="clear-btn" @click="clearFilters">Clear filters</button>
		</div>

		<p class="result-count">
			{{ filtered.length }} showcase{{ filtered.length !== 1 ? 's' : '' }}
		</p>

		<div class="card-grid">
			<a
				v-for="item in filtered"
				:key="item.url"
				:href="item.url"
				target="_blank"
				rel="noopener noreferrer"
				class="card"
			>
				<div v-if="item.thumbnail" class="card-thumb">
					<img :src="item.thumbnail" :alt="item.title" loading="lazy" />
				</div>
				<div v-else class="card-thumb placeholder">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path
							d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
						/>
					</svg>
				</div>
				<div class="card-body">
					<div class="card-title">{{ item.title }}</div>
					<div class="card-source">{{ item.source }}</div>
					<div class="card-desc">{{ item.description }}</div>
					<div class="card-tags">
						<span v-for="tag in item.tags" :key="tag" class="card-tag">{{
							formatTag(tag)
						}}</span>
					</div>
					<div class="card-url">{{ domain(item.url) }}</div>
				</div>
			</a>
		</div>
	</div>
</template>

<style scoped>
.showcases {
	max-width: 1152px;
	margin: 0 auto;
	padding: 0 24px;
}

/* Filters */
.filters {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	align-items: center;
	margin-bottom: 8px;
}

.filter-group {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px;
}

.filter-label {
	font-size: 13px;
	font-weight: 600;
	color: var(--vp-c-text-2);
	margin-right: 2px;
}

.pill {
	display: inline-block;
	padding: 4px 12px;
	border-radius: 16px;
	font-size: 13px;
	font-weight: 500;
	border: 1px solid var(--vp-c-divider);
	background: var(--vp-c-bg-soft);
	color: var(--vp-c-text-2);
	cursor: pointer;
	transition: all 0.2s;
	line-height: 1.4;
}

.pill:hover {
	border-color: var(--vp-c-brand-1);
	color: var(--vp-c-brand-1);
}

.pill.active {
	background: var(--vp-c-brand-1);
	color: #fff;
	border-color: var(--vp-c-brand-1);
}

.clear-btn {
	font-size: 13px;
	color: var(--vp-c-text-3);
	background: none;
	border: none;
	cursor: pointer;
	text-decoration: underline;
	padding: 4px 0;
}

.clear-btn:hover {
	color: var(--vp-c-text-1);
}

.result-count {
	font-size: 14px;
	color: var(--vp-c-text-3);
	margin-bottom: 16px;
}

/* Card grid */
.card-grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: 16px;
}

@media (min-width: 640px) {
	.card-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (min-width: 960px) {
	.card-grid {
		grid-template-columns: repeat(3, 1fr);
	}
}

/* Card */
.card {
	display: flex;
	flex-direction: column;
	border-radius: 12px;
	border: 1px solid var(--vp-c-divider);
	background: var(--vp-c-bg-soft);
	overflow: hidden;
	text-decoration: none;
	color: inherit;
	transition:
		border-color 0.2s,
		box-shadow 0.2s;
}

.card:hover {
	border-color: var(--vp-c-brand-1);
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-thumb {
	aspect-ratio: 16 / 9;
	overflow: hidden;
	background: var(--vp-c-bg-alt);
}

.card-thumb img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.card-thumb.placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--vp-c-text-3);
}

.card-thumb.placeholder svg {
	width: 40px;
	height: 40px;
}

.card-body {
	padding: 14px 16px;
	display: flex;
	flex-direction: column;
	gap: 4px;
	flex: 1;
}

.card-title {
	font-size: 15px;
	font-weight: 600;
	color: var(--vp-c-text-1);
	line-height: 1.4;
}

.card-source {
	font-size: 13px;
	font-weight: 500;
	color: var(--vp-c-brand-1);
}

.card-desc {
	font-size: 13px;
	color: var(--vp-c-text-2);
	line-height: 1.5;
	flex: 1;
}

.card-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
	margin-top: 4px;
}

.card-tag {
	font-size: 11px;
	padding: 2px 8px;
	border-radius: 10px;
	background: var(--vp-c-default-soft);
	color: var(--vp-c-text-2);
}

.card-url {
	font-size: 12px;
	color: var(--vp-c-text-3);
	margin-top: 4px;
}
</style>
