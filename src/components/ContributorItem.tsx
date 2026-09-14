import React from 'react';
import { Contributor } from '../types';
import {
  Avatar,
  ContributorCard,
  ContributorHeader,
  ContributorInfo,
  Contributions,
  TwitterStatus,
  Username,
} from '../styles';

interface Props {
  contributor: Contributor;
}

export function ContributorItem({ contributor }: Props) {
  return (
    <ContributorCard>
      <ContributorHeader>
        <Avatar src={contributor.avatar_url} alt={`${contributor.login}'s avatar`} />
        <ContributorInfo>
          <Username>
            <a
              href={`https://github.com/${contributor.login}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {contributor.login}
            </a>
          </Username>
          <Contributions>贡献: {contributor.contributions}</Contributions>
        </ContributorInfo>
      </ContributorHeader>

      {contributor.loading ? (
        <TwitterStatus $status="loading">加载资料中...</TwitterStatus>
      ) : contributor.error ? (
        <TwitterStatus $status="error">{contributor.error}</TwitterStatus>
      ) : contributor.has_twitter && contributor.twitter_username ? (
        <TwitterStatus $status="active">
          X/Twitter:{' '}
          <a
            href={`https://x.com/${contributor.twitter_username}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            @{contributor.twitter_username}
          </a>
        </TwitterStatus>
      ) : (
        <TwitterStatus $status="none">未提供 Twitter / X 信息</TwitterStatus>
      )}
    </ContributorCard>
  );
}
