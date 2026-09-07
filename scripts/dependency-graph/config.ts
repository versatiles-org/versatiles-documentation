/**
 * Editorial input for the dependency graph.
 *
 * Everything a parser cannot know — how repositories group into layers, which
 * Docker image is built by which repository, which findings are noise — lives
 * in `scripts/dependency-graph.yaml` so the code stays free of special cases.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import yaml from 'js-yaml';
import { EDGE_KINDS, type EdgeKind } from './model';

export interface GroupConfig {
	id: string;
	title: string;
	/** Short line printed above the group's repositories on the page. */
	summary: string;
	repos: string[];
}

export interface ManualEdgeConfig {
	from: string;
	to: string;
	kind: EdgeKind;
	note: string;
}

export interface IgnoreConfig {
	from: string;
	to: string;
	/** Restricts the rule to one kind; omit to drop the pair entirely. */
	kind?: EdgeKind;
	reason: string;
}

export interface GraphConfig {
	org: string;
	includeArchived: boolean;
	includeForks: boolean;
	groups: GroupConfig[];
	/** Docker image name (without tag) to the repository that builds it. */
	images: Record<string, string>;
	/** Repositories left out of the graph entirely. */
	exclude: string[];
	/** Repositories that support the work rather than being part of the product. */
	supporting: string[];
	manual: ManualEdgeConfig[];
	ignore: IgnoreConfig[];
}

export const CONFIG_PATH = 'scripts/dependency-graph.yaml';

function fail(message: string): never {
	throw new Error(`${CONFIG_PATH}: ${message}`);
}

function asEdgeKind(value: unknown, where: string): EdgeKind {
	if (typeof value !== 'string' || !(EDGE_KINDS as readonly string[]).includes(value)) {
		fail(`${where} has kind ${JSON.stringify(value)}, expected one of ${EDGE_KINDS.join(', ')}`);
	}
	return value as EdgeKind;
}

function asString(value: unknown, where: string): string {
	if (typeof value !== 'string' || value === '') fail(`${where} must be a non-empty string`);
	return value;
}

export function loadConfig(root: string): GraphConfig {
	const raw = yaml.load(readFileSync(resolve(root, CONFIG_PATH), 'utf8'));
	if (typeof raw !== 'object' || raw === null) fail('expected a mapping at the top level');
	const doc = raw as Record<string, unknown>;

	const groups = (doc.groups as unknown[] | undefined) ?? [];
	const manual = (doc.manual as unknown[] | undefined) ?? [];
	const ignore = (doc.ignore as unknown[] | undefined) ?? [];

	return {
		org: asString(doc.org, 'org'),
		includeArchived: doc.include_archived === true,
		includeForks: doc.include_forks !== false,
		groups: groups.map((entry, index) => {
			const group = entry as Record<string, unknown>;
			return {
				id: asString(group.id, `groups[${index}].id`),
				title: asString(group.title, `groups[${index}].title`),
				summary: asString(group.summary, `groups[${index}].summary`),
				repos: ((group.repos as string[] | undefined) ?? []).map((repo, position) =>
					asString(repo, `groups[${index}].repos[${position}]`),
				),
			};
		}),
		images: (doc.images as Record<string, string> | undefined) ?? {},
		exclude: (doc.exclude as string[] | undefined) ?? [],
		supporting: (
			((doc.roles as Record<string, unknown> | undefined)?.supporting as string[] | undefined) ??
			[]
		).map((repo, index) => asString(repo, `roles.supporting[${index}]`)),
		manual: manual.map((entry, index) => {
			const edge = entry as Record<string, unknown>;
			return {
				from: asString(edge.from, `manual[${index}].from`),
				to: asString(edge.to, `manual[${index}].to`),
				kind: asEdgeKind(edge.kind, `manual[${index}]`),
				note: asString(edge.note, `manual[${index}].note`),
			};
		}),
		ignore: ignore.map((entry, index) => {
			const rule = entry as Record<string, unknown>;
			return {
				from: asString(rule.from, `ignore[${index}].from`),
				to: asString(rule.to, `ignore[${index}].to`),
				kind: rule.kind === undefined ? undefined : asEdgeKind(rule.kind, `ignore[${index}]`),
				reason: asString(rule.reason, `ignore[${index}].reason`),
			};
		}),
	};
}

/**
 * Reports config entries that no longer match reality. Repositories get
 * renamed and archived; without this the configuration quietly rots.
 */
export function validateConfig(config: GraphConfig, knownRepos: Set<string>): string[] {
	const problems: string[] = [];
	const seen = new Map<string, string>();

	const checkRepo = (name: string, where: string): void => {
		if (!knownRepos.has(name)) problems.push(`${where}: unknown repository "${name}"`);
	};

	for (const group of config.groups) {
		for (const repo of group.repos) {
			checkRepo(repo, `groups.${group.id}`);
			const previous = seen.get(repo);
			if (previous) problems.push(`"${repo}" is listed in both ${previous} and ${group.id}`);
			seen.set(repo, group.id);
		}
	}
	for (const repo of config.exclude) checkRepo(repo, 'exclude');
	for (const repo of config.supporting) checkRepo(repo, 'roles.supporting');
	for (const image of Object.values(config.images)) checkRepo(image, 'images');
	for (const edge of config.manual) {
		checkRepo(edge.from, 'manual');
		checkRepo(edge.to, 'manual');
	}
	for (const rule of config.ignore) {
		checkRepo(rule.from, 'ignore');
		checkRepo(rule.to, 'ignore');
	}
	return problems;
}
