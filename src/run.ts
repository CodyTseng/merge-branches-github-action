import * as core from '@actions/core';
import * as github from '@actions/github';
import { PullRequestService } from './pull-request';
import { QueryService } from './query';
import * as exec from '@actions/exec';

export async function run() {
  const token = core.getInput('token', {
    required: true,
  });

  const base = core.getInput('base');
  const target = core.getInput('target');
  const labelName = core.getInput('label-name');
  core.debug(`base=${base}; target=${target}; label-name=${labelName}`);

  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;

  core.info(`owner=${owner}; repo=${repo}`);

  const queryService = new QueryService(octokit);
  const pullRequestService = new PullRequestService(queryService, owner, repo);

  const prs = await pullRequestService.getAllPRs();

  core.info(`found ${prs.length} PRs`);

  const prsWithSpecifiedLabel = prs
    .filter((pr) => pr.labels.nodes.some((label) => label.name === labelName))
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  core.info(
    `found ${prsWithSpecifiedLabel.length} PRs with the ${labelName} label`,
  );

  await exec.exec('git fetch origin');
  await exec.exec(`git checkout ${base}`);
  await exec.exec(`git checkout -b ${target}`);

  for (const pr of prsWithSpecifiedLabel) {
    if (pr.baseRefName !== base) {
      core.warning(
        `the base branch of #${pr.number} PR (${pr.url}) is ${pr.baseRefName} not ${base}`,
      );
    }
    try {
      await exec.exec(`git merge origin/${pr.headRefName}`);
    } catch (error) {
      core.setFailed(`#${pr.number} PR (${pr.url}) merge failed`);
      throw error;
    }
  }

  await exec.exec(`git push origin ${target} -f`);
}
