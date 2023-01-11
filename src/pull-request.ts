import { PullRequest } from './interface';
import { QueryService } from './query';

export class PullRequestService {
  constructor(
    private readonly queryService: QueryService,
    private readonly owner: string,
    private readonly repo: string,
  ) {}

  async getAllPRs() {
    let cursor: string | undefined;
    let hasNextPage = true;

    const prs: PullRequest[] = [];

    while (hasNextPage) {
      const repoPRs = await this.queryService.getRepositoryPullRequests(
        this.owner,
        this.repo,
        cursor,
      );

      if (!repoPRs || !repoPRs.repository) {
        throw new Error(
          `Failed to get list of PRs: ${JSON.stringify(repoPRs)}`,
        );
      }

      prs.push(...repoPRs.repository.pullRequests.nodes);

      cursor = repoPRs.repository.pullRequests.pageInfo.endCursor;
      hasNextPage = repoPRs.repository.pullRequests.pageInfo.hasNextPage;
    }

    return prs;
  }
}
