import { GitHub, RepositoryPullRequests } from './interface';

export class QueryService {
  constructor(private readonly octokit: GitHub) {}

  async getRepositoryPullRequests(
    owner: string,
    repo: string,
    cursor?: string,
  ) {
    const query = `query ($owner: String!, $repo: String!, $after: String) {
        repository(owner: $owner, name: $repo) {
          pullRequests(first: 100, states: OPEN, after: $after) {
            nodes {
              id
              number
              title
              url
              createdAt
              headRefName
              baseRefName
              labels(last: 100) {
                nodes {
                  id
                  name
                }
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }`;

    return this.octokit.graphql<RepositoryPullRequests>(query, {
      owner,
      repo,
      after: cursor,
    });
  }
}
