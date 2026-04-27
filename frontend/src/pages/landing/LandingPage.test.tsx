import { describe, expect, test, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from './LandingPage';
import { useSessionStore } from '../../stores/sessionStore';
import { useRoomStore, defaultSettings } from '../../stores/roomStore';
import { useGameStore } from '../../stores/gameStore';
import { hostRoom, joinRoom } from '../../features/room/roomApi';

vi.mock('../../features/room/roomApi', () => ({
  hostRoom: vi.fn(),
  joinRoom: vi.fn(),
}));

vi.mock('../../features/socket/useSocketLifecycle', () => ({
  useSocketLifecycle: () => undefined,
}));

describe('LandingPage', () => {
  beforeEach(() => {
    useSessionStore.setState({
      username: '',
      roomCode: '',
    });
    useRoomStore.setState({
      code: '',
      host: '',
      players: [],
      playerCount: 0,
      canStart: false,
      settings: defaultSettings,
    });
    useGameStore.setState({ lastError: '', connectionState: 'connected', roundInProgress: false, code: '' });
    vi.mocked(hostRoom).mockReset();
    vi.mocked(joinRoom).mockReset();
    vi.restoreAllMocks();
  });

  test('home entry opens create and join flows in new tabs', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('去创建牌局页'));
    fireEvent.click(screen.getByText('去加入牌局页'));

    expect(openSpy).toHaveBeenNthCalledWith(1, '/create', '_blank', 'noopener,noreferrer');
    expect(openSpy).toHaveBeenNthCalledWith(2, '/join', '_blank', 'noopener,noreferrer');
  });

  test('host mode waits for room snapshot before navigating away', async () => {
    useSessionStore.setState({ username: 'Ayanami' });

    render(
      <MemoryRouter>
        <LandingPage initialEntryMode="host" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('创建这桌牌局'));

    expect(hostRoom).toHaveBeenCalledWith('Ayanami', {
      smallBlind: 1,
      bigBlind: 2,
      startingStack: 100,
      autoRebuy: true,
    });
    expect(screen.getByText('创建这桌牌局')).toBeInTheDocument();

    await act(async () => {
      useRoomStore.setState({
        code: 'AB12',
        host: 'Ayanami',
        players: ['Ayanami'],
        playerCount: 1,
        canStart: false,
      });
    });

    expect(useRoomStore.getState()).toMatchObject({
      code: 'AB12',
      host: 'Ayanami',
      players: ['Ayanami'],
    });
  });

  test('host mode sanitizes blinds and stack before creating a room', () => {
    useSessionStore.setState({ username: 'Ayanami' });
    useRoomStore.setState({
      settings: {
        smallBlind: 0,
        bigBlind: 0,
        startingStack: 5,
        autoRebuy: false,
      },
    });

    render(
      <MemoryRouter>
        <LandingPage initialEntryMode="host" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('创建这桌牌局'));

    expect(hostRoom).toHaveBeenCalledWith('Ayanami', {
      smallBlind: 1,
      bigBlind: 2,
      startingStack: 20,
      autoRebuy: false,
    });
    expect(useRoomStore.getState()).toMatchObject({
      host: 'Ayanami',
      players: ['Ayanami'],
      playerCount: 1,
      settings: {
        smallBlind: 1,
        bigBlind: 2,
        startingStack: 20,
        autoRebuy: false,
      },
    });
  });

  test('join mode waits for room snapshot before navigating away', async () => {
    useSessionStore.setState({
      username: 'Shinji',
      roomCode: 'ab12',
    });

    render(
      <MemoryRouter>
        <LandingPage initialEntryMode="join" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('立即加入这桌'));

    expect(joinRoom).toHaveBeenCalledWith('Shinji', 'ab12');
    expect(screen.getByText('立即加入这桌')).toBeInTheDocument();

    await act(async () => {
      useRoomStore.setState({
        code: 'AB12',
        host: 'Ayanami',
        players: ['Ayanami', 'Shinji'],
        playerCount: 2,
        canStart: true,
      });
    });

    expect(useRoomStore.getState()).toMatchObject({
      code: 'AB12',
      host: 'Ayanami',
      players: ['Ayanami', 'Shinji'],
    });
  });

  test('join mode triggers room join with the entered code', () => {
    useSessionStore.setState({
      username: 'Shinji',
      roomCode: 'ab12',
    });

    render(
      <MemoryRouter>
        <LandingPage initialEntryMode="join" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('立即加入这桌'));

    expect(joinRoom).toHaveBeenCalledWith('Shinji', 'ab12');
  });
});
