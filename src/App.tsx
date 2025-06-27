import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// 类型定义
interface Contributor {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
  twitter_username: string | null;
  has_twitter: boolean | null;
  twitter_exists: boolean | null;
  loading: boolean;
  checking_twitter: boolean;
}

interface RepoInfo {
  owner: string;
  repo: string;
}

// GitHub API配置
const GITHUB_API_BASE_URL = 'https://api.github.com';
// 如果有GitHub个人访问令牌，可以在这里添加
// 格式: 'token YOUR_PERSONAL_ACCESS_TOKEN'
const GITHUB_AUTH_TOKEN = '';

// 创建axios实例，用于GitHub API请求
const githubApi = axios.create({
  baseURL: GITHUB_API_BASE_URL,
  headers: {
    'Accept': 'application/vnd.github.v3+json',
    ...(GITHUB_AUTH_TOKEN ? { 'Authorization': GITHUB_AUTH_TOKEN } : {})
  },
  timeout: 10000 // 10秒超时
});

// 检查Twitter账号是否存在
const checkTwitterExists = async (username: string): Promise<boolean> => {
  try {
    // 设置超时时间较短，以避免长时间等待
    const response = await axios.get(`https://twitter.com/${username}`, {
      timeout: 5000,
      // 设置不跟随重定向，因为Twitter可能会重定向到登录页面
      maxRedirects: 0,
      validateStatus: (status) => {
        return status < 500; // 只接受状态码小于500的响应
      }
    });
    
    // 如果返回200，说明用户存在
    return response.status === 200;
  } catch (error: any) {
    // 如果是404错误，说明用户不存在
    if (error.response && error.response.status === 404) {
      return false;
    }
    
    // 如果是其他错误（例如网络问题或超时），我们假设用户存在
    // 这是为了避免错误地报告用户不存在
    console.error('Error checking Twitter:', error);
    return true;
  }
};

// 样式组件
const AppContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
`;

const Title = styled.h1`
  color: #333;
  text-align: center;
  margin-bottom: 2rem;
`;

const InputForm = styled.form`
  display: flex;
  margin-bottom: 2rem;
  gap: 1rem;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
`;

const Button = styled.button`
  background-color: #0366d6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #024ea2;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ContributorsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const ContributorCard = styled.div`
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-5px);
  }
`;

const Avatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-right: 1rem;
`;

const ContributorHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const ContributorInfo = styled.div`
  flex: 1;
`;

const Username = styled.h3`
  margin: 0;
  margin-bottom: 0.25rem;
`;

const Contributions = styled.p`
  color: #586069;
  margin: 0;
`;

// 创建新的TwitterStatus组件
const TwitterStatus = styled.div<{ status: "loading" | "checking" | "active" | "inactive" | "none" }>`
  margin-top: 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  text-align: center;
  background-color: ${props => {
    switch(props.status) {
      case 'loading': return '#f6f8fa';
      case 'checking': return '#fff8c5';
      case 'active': return '#e6ffec';
      case 'inactive': return '#ffebe9';
      case 'none': return '#fff0f0';
    }
  }};
  color: ${props => {
    switch(props.status) {
      case 'loading': return '#586069';
      case 'checking': return '#9a6700';
      case 'active': return '#1a7f37';
      case 'inactive': return '#cf222e';
      case 'none': return '#cf222e';
    }
  }};
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #0366d6;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  margin: 2rem auto;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const StatsContainer = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f6f8fa;
  border-radius: 6px;
  text-align: center;
`;

const InfoBox = styled.div`
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #f6f8fa;
  border-radius: 6px;
  text-align: center;
`;

const AdvancedLink = styled.a`
  color: #0366d6;
  text-decoration: none;
  cursor: pointer;
  margin-left: 0.5rem;
`;

const TokenInputContainer = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: #fff;
  border-radius: 6px;
  text-align: center;
`;

const Checkbox = styled.input`
  margin-right: 0.5rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #586069;
`;

// 辅助函数
const parseGitHubUrl = (url: string): RepoInfo | null => {
  try {
    // 删除URL末尾可能的斜杠
    let urlStr = url.trim().replace(/\/+$/, '');
    
    // 处理"github.com/user/repo"格式（无协议）
    if (!urlStr.includes('://')) {
      if (urlStr.startsWith('github.com/')) {
        urlStr = 'https://' + urlStr;
      } else {
        urlStr = 'https://github.com/' + urlStr;
      }
    }
    
    // 处理"user/repo"格式（无域名）
    if (!urlStr.includes('github.com')) {
      const parts = urlStr.split('/').filter(part => part.length > 0);
      if (parts.length === 2) {
        urlStr = `https://github.com/${parts[0]}/${parts[1]}`;
      }
    }
    
    const urlObj = new URL(urlStr);
    
    // 确保是github.com域名
    if (urlObj.hostname !== 'github.com' && urlObj.hostname !== 'www.github.com') {
      return null;
    }
    
    // 提取路径部分
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    
    // GitHub仓库路径格式为 /user/repo
    if (pathParts.length < 2) {
      return null;
    }
    
    // 移除可能的额外路径部分，如 /tree/master, /blob/, /issues 等
    const owner = pathParts[0];
    const repo = pathParts[1];
    
    // 确保用户名和仓库名不包含非法字符
    if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
      return null;
    }
    
    return {
      owner,
      repo
    };
  } catch (error) {
    console.error('Error parsing GitHub URL:', error);
    return null;
  }
};

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(false);
  const [twitterStats, setTwitterStats] = useState({
    total: 0,
    withTwitter: 0,
    withActiveTwitter: 0
  });
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [checkTwitterActive, setCheckTwitterActive] = useState(true); // 是否检查Twitter账号状态
  
  // 创建动态的API实例
  const getApiInstance = () => {
    return axios.create({
      baseURL: GITHUB_API_BASE_URL,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        ...(githubToken ? { 'Authorization': `token ${githubToken}` } : {})
      },
      timeout: 10000
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRepoUrl(e.target.value);
  };
  
  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGithubToken(e.target.value);
  };

  const fetchContributors = async (owner: string, repo: string) => {
    // 获取带有最新token的API实例
    const api = getApiInstance();
    
    try {
      // 先验证仓库是否存在
      try {
        await api.get(`/repos/${owner}/${repo}`);
      } catch (repoError: any) {
        if (repoError.response) {
          if (repoError.response.status === 404) {
            toast.error('找不到该仓库，请检查仓库链接是否正确。');
          } else if (repoError.response.status === 403) {
            toast.error('API请求频率限制，请稍后再试。');
          } else {
            toast.error(`GitHub API错误: ${repoError.response.status}`);
          }
        } else if (repoError.request) {
          toast.error('网络请求失败，请检查网络连接。');
        } else {
          toast.error('发生未知错误，请稍后重试。');
        }
        return;
      }

      // 获取仓库贡献者列表
      const response = await api.get(`/repos/${owner}/${repo}/contributors`, {
        params: {
          per_page: 100,
          anon: 0
        }
      });
      
      if (!Array.isArray(response.data) || response.data.length === 0) {
        toast.info('该仓库没有贡献者数据。');
        return;
      }
      
      const contributors: Contributor[] = response.data.map((contributor: any) => ({
        id: contributor.id,
        login: contributor.login,
        avatar_url: contributor.avatar_url,
        contributions: contributor.contributions,
        twitter_username: null,
        has_twitter: null,
        twitter_exists: null,
        loading: true,
        checking_twitter: false
      }));
      
      setContributors(contributors);
      
      // 对每个贡献者获取个人资料信息
      // 为了避免API请求速率限制，添加一些延迟
      let withTwitter = 0;
      let withActiveTwitter = 0;
      
      for (let i = 0; i < contributors.length; i++) {
        try {
          // 每次请求之间添加短暂延迟
          if (i > 0 && i % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          const userResponse = await api.get(`/users/${contributors[i].login}`);
          const twitterUsername = userResponse.data.twitter_username;
          
          if (twitterUsername) {
            withTwitter++;
            
            // 更新状态以显示正在检查Twitter
            if (checkTwitterActive) {
              setContributors(prevState => {
                const newState = [...prevState];
                newState[i] = {
                  ...newState[i],
                  twitter_username: twitterUsername,
                  has_twitter: true,
                  loading: false,
                  checking_twitter: true
                };
                return newState;
              });
              
              // 检查Twitter账号是否存在
              try {
                const exists = await checkTwitterExists(twitterUsername);
                if (exists) {
                  withActiveTwitter++;
                }
                
                setContributors(prevState => {
                  const newState = [...prevState];
                  newState[i] = {
                    ...newState[i],
                    twitter_exists: exists,
                    checking_twitter: false
                  };
                  return newState;
                });
              } catch (twitterError) {
                console.error(`Error checking Twitter for ${twitterUsername}:`, twitterError);
                setContributors(prevState => {
                  const newState = [...prevState];
                  newState[i] = {
                    ...newState[i],
                    twitter_exists: true, // 默认假设存在
                    checking_twitter: false
                  };
                  return newState;
                });
              }
            } else {
              // 如果不检查Twitter状态，则直接更新
              setContributors(prevState => {
                const newState = [...prevState];
                newState[i] = {
                  ...newState[i],
                  twitter_username: twitterUsername,
                  has_twitter: true,
                  twitter_exists: true, // 默认假设存在
                  loading: false,
                  checking_twitter: false
                };
                return newState;
              });
              withActiveTwitter++;
            }
          } else {
            // 用户没有Twitter
            setContributors(prevState => {
              const newState = [...prevState];
              newState[i] = {
                ...newState[i],
                twitter_username: null,
                has_twitter: false,
                twitter_exists: false,
                loading: false,
                checking_twitter: false
              };
              return newState;
            });
          }
        } catch (userError: any) {
          console.error(`Error fetching user ${contributors[i].login}:`, userError);
          
          // 处理API错误
          if (userError.response && userError.response.status === 403) {
            toast.error('GitHub API速率限制已达到，请稍后再试。');
            break;  // 中断循环，不再请求其他用户
          }
          
          setContributors(prevState => {
            const newState = [...prevState];
            newState[i] = {
              ...newState[i],
              loading: false,
              checking_twitter: false
            };
            return newState;
          });
        }
      }
      
      // 更新统计信息
      setTwitterStats({
        total: contributors.length,
        withTwitter: withTwitter,
        withActiveTwitter: withActiveTwitter
      });
      
    } catch (error: any) {
      console.error('Error fetching contributors:', error);
      
      // 详细的错误处理
      if (error.response) {
        // 服务器返回了错误状态码
        if (error.response.status === 404) {
          toast.error('找不到该仓库，请检查仓库链接是否正确。');
        } else if (error.response.status === 403) {
          toast.error('GitHub API请求频率限制已达到，请稍后再试。');
        } else {
          toast.error(`GitHub API错误: ${error.response.status}`);
        }
      } else if (error.request) {
        // 请求已发出但没有收到响应
        toast.error('网络请求失败，请检查网络连接。');
      } else {
        // 其他错误
        toast.error('获取贡献者数据时出现错误。');
      }
      
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setContributors([]);
    setTwitterStats({
      total: 0,
      withTwitter: 0,
      withActiveTwitter: 0
    });
    
    const repoInfo = parseGitHubUrl(repoUrl);
    
    if (!repoInfo) {
      toast.error('请输入有效的GitHub仓库链接，例如: https://github.com/facebook/react');
      return;
    }
    
    setLoading(true);
    try {
      await fetchContributors(repoInfo.owner, repoInfo.repo);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContainer>
      <Title>GitHub贡献者Twitter检测工具</Title>
      
      <InfoBox>
        <p>输入GitHub仓库链接，检查该仓库的贡献者是否在其个人资料中提供了Twitter信息。</p>
        <AdvancedLink onClick={() => setShowTokenInput(!showTokenInput)}>
          {showTokenInput ? '隐藏高级设置' : '显示高级设置'} ▾
        </AdvancedLink>
        
        {showTokenInput && (
          <TokenInputContainer>
            <p>GitHub API有请求速率限制。添加个人访问令牌可以增加请求限制。</p>
            <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer">
              创建GitHub个人访问令牌
            </a>
            <Input
              type="text"
              placeholder="输入GitHub个人访问令牌（可选）"
              value={githubToken}
              onChange={handleTokenChange}
            />
            <CheckboxLabel>
              <Checkbox
                type="checkbox"
                checked={checkTwitterActive}
                onChange={(e) => setCheckTwitterActive(e.target.checked)}
              />
              检查Twitter账号是否仍然活跃（可能会延长加载时间）
            </CheckboxLabel>
          </TokenInputContainer>
        )}
      </InfoBox>
      
      <InputForm onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="输入GitHub仓库链接 (例如: https://github.com/facebook/react)"
          value={repoUrl}
          onChange={handleInputChange}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? '加载中...' : '检查'}
        </Button>
      </InputForm>
      
      {contributors.length > 0 && (
        <StatsContainer>
          <h3>统计信息</h3>
          <p>贡献者总数: {twitterStats.total}</p>
          <p>带有Twitter链接的贡献者: {twitterStats.withTwitter} ({Math.round((twitterStats.withTwitter / twitterStats.total) * 100)}%)</p>
          {checkTwitterActive && (
            <p>带有活跃Twitter链接的贡献者: {twitterStats.withActiveTwitter} ({Math.round((twitterStats.withActiveTwitter / twitterStats.total) * 100)}%)</p>
          )}
        </StatsContainer>
      )}
      
      {loading && <LoadingSpinner />}
      
      <ContributorsList>
        {contributors.map(contributor => (
          <ContributorCard key={contributor.id}>
            <ContributorHeader>
              <Avatar src={contributor.avatar_url} alt={`${contributor.login}'s avatar`} />
              <ContributorInfo>
                <Username>
                  <a href={`https://github.com/${contributor.login}`} target="_blank" rel="noopener noreferrer">
                    {contributor.login}
                  </a>
                </Username>
                <Contributions>贡献: {contributor.contributions}</Contributions>
              </ContributorInfo>
            </ContributorHeader>
            
            {contributor.loading ? (
              <TwitterStatus status="loading">加载中...</TwitterStatus>
            ) : contributor.checking_twitter ? (
              <TwitterStatus status="checking">正在检查Twitter状态...</TwitterStatus>
            ) : !contributor.has_twitter ? (
              <TwitterStatus status="none">未提供Twitter信息</TwitterStatus>
            ) : contributor.twitter_exists ? (
              <TwitterStatus status="active">
                Twitter: <a 
                  href={`https://twitter.com/${contributor.twitter_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{contributor.twitter_username}
                </a>
              </TwitterStatus>
            ) : (
              <TwitterStatus status="inactive">
                Twitter账号可能已注销或更改ID: @{contributor.twitter_username}
              </TwitterStatus>
            )}
          </ContributorCard>
        ))}
      </ContributorsList>
      
      <ToastContainer position="bottom-right" />
    </AppContainer>
  );
}

export default App;
