import * as github from '@actions/github';

export type GitHub = ReturnType<typeof github.getOctokit>;

export interface Label {
  id: string;
  name: string;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  url: string;
  createdAt: string;
  headRefName: string;
  baseRefName: string;
  labels: {
    nodes: Label[];
  };
}

export interface PageInfo {
  endCursor: string;
  hasNextPage: boolean;
}

export interface RepositoryPullRequests {
  repository: {
    pullRequests: {
      nodes: PullRequest[];
      pageInfo: PageInfo;
    };
  };
}
