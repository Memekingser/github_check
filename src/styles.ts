import styled from 'styled-components';

export const AppContainer = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1.25rem 3rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
    'Open Sans', 'Helvetica Neue', sans-serif;
  color: #24292f;
`;

export const Title = styled.h1`
  color: #24292f;
  text-align: center;
  margin-bottom: 0.5rem;
  font-size: 1.75rem;
`;

export const Subtitle = styled.p`
  text-align: center;
  color: #57606a;
  margin: 0 0 1.5rem;
`;

export const InputForm = styled.form`
  display: flex;
  margin-bottom: 1rem;
  gap: 0.75rem;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

export const Input = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  font-size: 1rem;

  &:focus {
    outline: 2px solid #0969da33;
    border-color: #0969da;
  }
`;

export const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  background-color: ${(p) =>
    p.$variant === 'secondary' ? '#f6f8fa' : p.$variant === 'danger' ? '#cf222e' : '#0969da'};
  color: ${(p) => (p.$variant === 'secondary' ? '#24292f' : '#fff')};
  border: 1px solid
    ${(p) =>
      p.$variant === 'secondary' ? '#d0d7de' : p.$variant === 'danger' ? '#cf222e' : '#0969da'};
  border-radius: 6px;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background-color: ${(p) =>
      p.$variant === 'secondary' ? '#eef1f4' : p.$variant === 'danger' ? '#a40e26' : '#0860ca'};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export const ContributorsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
`;

export const ContributorCard = styled.div`
  border: 1px solid #d0d7de;
  border-radius: 8px;
  padding: 1.25rem;
  background: #fff;
  transition: border-color 0.2s;

  &:hover {
    border-color: #0969da;
  }
`;

export const Avatar = styled.img`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  margin-right: 0.85rem;
`;

export const ContributorHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.85rem;
`;

export const ContributorInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const Username = styled.h3`
  margin: 0 0 0.2rem;
  font-size: 1rem;

  a {
    color: #0969da;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`;

export const Contributions = styled.p`
  color: #57606a;
  margin: 0;
  font-size: 0.875rem;
`;

export const TwitterStatus = styled.div<{ $status: 'loading' | 'active' | 'none' | 'error' }>`
  margin-top: 0.5rem;
  padding: 0.5rem 0.65rem;
  border-radius: 6px;
  text-align: center;
  font-size: 0.9rem;
  background-color: ${(p) => {
    switch (p.$status) {
      case 'loading':
        return '#f6f8fa';
      case 'active':
        return '#ddf4ff';
      case 'none':
        return '#fff8c5';
      case 'error':
        return '#ffebe9';
    }
  }};
  color: ${(p) => {
    switch (p.$status) {
      case 'loading':
        return '#57606a';
      case 'active':
        return '#0550ae';
      case 'none':
        return '#9a6700';
      case 'error':
        return '#cf222e';
    }
  }};

  a {
    color: inherit;
    font-weight: 600;
  }
`;

export const LoadingSpinner = styled.div`
  border: 3px solid rgba(9, 105, 218, 0.15);
  border-left-color: #0969da;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  animation: spin 0.8s linear infinite;
  margin: 1.5rem auto;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const Panel = styled.div`
  margin-bottom: 1rem;
  padding: 1rem 1.1rem;
  background-color: #f6f8fa;
  border: 1px solid #d0d7de;
  border-radius: 8px;
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  text-align: center;
`;

export const StatItem = styled.div`
  background: #fff;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  padding: 0.75rem;

  strong {
    display: block;
    font-size: 1.35rem;
    color: #0969da;
  }

  span {
    font-size: 0.8rem;
    color: #57606a;
  }
`;

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1rem;
`;

export const Select = styled.select`
  padding: 0.5rem 0.65rem;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: #fff;
  font-size: 0.9rem;
`;

export const AdvancedToggle = styled.button`
  background: none;
  border: none;
  color: #0969da;
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;

  &:hover {
    text-decoration: underline;
  }
`;

export const TokenBox = styled.div`
  margin-top: 0.85rem;
  padding: 0.85rem;
  background: #fff;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;

  a {
    color: #0969da;
    font-size: 0.9rem;
  }
`;

export const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #57606a;
  margin-bottom: 1rem;
`;

export const ProgressBarTrack = styled.div`
  height: 8px;
  background: #eaeef2;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

export const ProgressBarFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${(p) => Math.min(100, Math.max(0, p.$pct))}%;
  background: #0969da;
  transition: width 0.2s ease;
`;
