import * as core from '@actions/core';
import { exec } from '@actions/exec';
import * as github from '@actions/github';
import { PullRequest } from './interface';
import { PullRequestService } from './pull-request';
import { QueryService } from './query';

export async function run() {
  const token = core.getInput('token', {
    required: true,
  });

  const base = core.getInput('base');
  const target = core.getInput('target');
  const labelName = core.getInput('label-name');
  const email = core.getInput('email');
  const name = core.getInput('name');
  core.debug(`base=${base}; target=${target}; label-name=${labelName}`);

  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;

  core.debug(`owner=${owner}; repo=${repo}`);

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

  const successPRs: PullRequest[] = [];
  const failedPRs: PullRequest[] = [];

  await exec(`git config --global user.email ${email}`);
  await exec(`git config --global user.name ${name}`);
  await exec('git fetch origin');
  await exec(`git checkout ${base}`);
  await exec('git pull origin');
  await exec(`git checkout -b ${target}`);

  for (const pr of prsWithSpecifiedLabel) {
    if (pr.baseRefName !== base) {
      core.warning(
        `the base branch of #${pr.number} PR (${pr.url}) is ${pr.baseRefName} not ${base}`,
      );
    }
    try {
      await exec(`git merge origin/${pr.headRefName}`);
      successPRs.push(pr);
    } catch (error) {
      exec('git merge --abort');
      failedPRs.push(pr);
    }
  }

  await exec(`git push origin ${target} -f`);

  core.info('merged successful PRs:');
  successPRs.forEach((pr) => core.info(`- ${pr.title} (${pr.url})`));

  if (failedPRs.length > 0) {
    core.error('merged failed PRs (need to merge manually):');
    failedPRs.forEach((pr) => core.error(`- ${pr.title} (${pr.url})`));
    core.setFailed(`${failedPRs.length} PRs failed to merge`);
  }
}
