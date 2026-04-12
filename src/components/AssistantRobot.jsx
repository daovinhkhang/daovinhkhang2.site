import { useEffect, useRef, useState } from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sectionFromAnchor(anchorId) {
  if (!anchorId) return 'home';
  if (anchorId.startsWith('exp-') || anchorId === 'experience') return 'experience';
  if (anchorId.startsWith('proj-') || anchorId === 'projects') return 'projects';
  if (anchorId.startsWith('skill-') || anchorId === 'skills') return 'skills';
  if (anchorId.startsWith('whisper-') || anchorId === 'whisper-flow') return 'whisper-flow';
  if (anchorId === 'profile' || anchorId === 'contact' || anchorId === 'home') return anchorId;
  if (anchorId === 'education') return 'education';
  if (anchorId === 'summary') return 'summary';
  return 'home';
}

function getViewportBounds() {
  return {
    minX: 10,
    maxX: Math.max(10, window.innerWidth - 330),
    minY: 16,
    maxY: Math.max(16, window.innerHeight - 200),
  };
}

function getRandomWaypoint() {
  const bounds = getViewportBounds();
  return {
    x: bounds.minX + Math.random() * Math.max(1, bounds.maxX - bounds.minX),
    y: bounds.minY + Math.random() * Math.max(1, bounds.maxY - bounds.minY),
  };
}

function getAssistantSize() {
  const isMobile = window.innerWidth <= 819;
  return {
    width: isMobile ? 360 : 450,
    height: isMobile ? 150 : 180,
  };
}

function getCenterWaypoint() {
  const size = getAssistantSize();
  const bounds = getViewportBounds();
  return {
    x: clamp(window.innerWidth * 0.5 - size.width * 0.5, bounds.minX, bounds.maxX),
    y: clamp(window.innerHeight * 0.5 - size.height * 0.5, bounds.minY, bounds.maxY),
  };
}

function trimHistory(history) {
  return history.slice(-5);
}

function isTourIntent(message) {
  return /(tour|guide me|show me around|walk me through|take me around|tham quan|dan toi tham quan|gioi thieu portfolio|dẫn tôi tham quan)/i.test(
    message,
  );
}

function normalizeControls(controls) {
  const expression = ['idle', 'happy', 'sad', 'surprised'].includes(controls?.expression) ? controls.expression : 'idle';
  return {
    expression,
    followCursor: controls?.followCursor ?? Boolean(controls?.accessory),
  };
}

function normalizeAction(action) {
  if (!action || typeof action !== 'object') {
    return null;
  }

  const type = action.type === 'open-link' || action.type === 'open-gmail' ? action.type : null;
  const url = typeof action.url === 'string' ? action.url.trim() : '';
  if (!type || !url) {
    return null;
  }

  return {
    type,
    label: `${action.label || ''}`.trim() || (type === 'open-gmail' ? 'Open Gmail Compose' : 'Open Link'),
    url,
  };
}

function AssistantRobot() {
  const botRef = useRef(null);
  const shellRef = useRef(null);
  const rafRef = useRef(0);

  const [activeSection, setActiveSection] = useState('home');
  const [activeAnchor, setActiveAnchor] = useState('home');
  const [question, setQuestion] = useState('');
  const [aiReply, setAiReply] = useState("Welcome to Dao Vinh Khang's portfolio.");
  const [isLoading, setIsLoading] = useState(false);
  const [isTourRunning, setIsTourRunning] = useState(false);
  const [robotCue, setRobotCue] = useState({
    expression: 'idle',
    followCursor: true,
    stamp: 0,
  });

  const activeAnchorRef = useRef('home');
  const isLoadingRef = useRef(false);
  const chatHistoryRef = useRef([]);
  const lastProactiveSectionRef = useRef(null);
  const lastProactiveAtRef = useRef(0);
  const proactiveBusyRef = useRef(false);
  const proactiveMuteUntilRef = useRef(0);
  const tourTimerRef = useRef(0);
  const tourActiveRef = useRef(false);
  const focusAnchorRef = useRef(null);
  const focusAnchorUntilRef = useRef(0);
  const actionFlightRef = useRef({
    active: false,
    startedAt: 0,
    hiddenAtCenter: false,
  });

  const currentRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({
    active: false,
    offsetX: 0,
    offsetY: 0,
    pointerId: null,
    draggingClassApplied: false,
  });
  const freezeUntilRef = useRef(0);
  const roamCooldownUntilRef = useRef(0);

  const { rive, RiveComponent } = useRive({
    src: '/rive/cool.riv',
    artboard: 'Catbot',
    stateMachines: 'State Machine',
    autoplay: true,
  });

  const faceToChatTrigger = useStateMachineInput(rive, 'State Machine', 'Face to chat');
  const faceToErrorTrigger = useStateMachineInput(rive, 'State Machine', 'Face to error');
  const faceToDownloadTrigger = useStateMachineInput(rive, 'State Machine', 'Face to download');
  const resetFaceTrigger = useStateMachineInput(rive, 'State Machine', 'Reset Face');
  const faceFollowCursorInput = useStateMachineInput(rive, 'State Machine', 'Face Follow Cursor', true);

  useEffect(() => {
    activeAnchorRef.current = activeAnchor;
  }, [activeAnchor]);

  useEffect(() => {
    if (faceFollowCursorInput) {
      faceFollowCursorInput.value = robotCue.followCursor;
    }
  }, [faceFollowCursorInput, robotCue.followCursor]);

  useEffect(() => {
    if (!robotCue.stamp) {
      return;
    }

    if (robotCue.expression === 'idle' && resetFaceTrigger) {
      resetFaceTrigger.fire();
      return;
    }

    if (robotCue.expression === 'happy' && faceToChatTrigger) {
      faceToChatTrigger.fire();
      return;
    }

    if (robotCue.expression === 'sad' && faceToErrorTrigger) {
      faceToErrorTrigger.fire();
      return;
    }

    if (robotCue.expression === 'surprised' && faceToDownloadTrigger) {
      faceToDownloadTrigger.fire();
    }
  }, [faceToChatTrigger, faceToDownloadTrigger, faceToErrorTrigger, resetFaceTrigger, robotCue.expression, robotCue.stamp]);

  const extendFreeze = (ms) => {
    const now = performance.now();
    freezeUntilRef.current = Math.max(freezeUntilRef.current, now + ms);
  };

  const requestAssistant = async (content, section, anchor, mode = 'chat', history = []) => {
    const payload = JSON.stringify({
      message: content,
      section,
      anchor,
      mode,
      history,
    });

    const callAssistant = async (url) => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 18000);

      try {
        return await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          signal: controller.signal,
        });
      } catch (error) {
        if (error?.name === 'AbortError') {
          throw new Error(`Assistant request timed out at ${url}`);
        }
        throw error;
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    const localFallback =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8888/.netlify/functions/assistant-chat'
        : null;

    const candidateUrls = ['/.netlify/functions/assistant-chat', '/api/assistant', localFallback].filter(Boolean);

    let response = null;
    for (const url of candidateUrls) {
      try {
        const res = await callAssistant(url);
        if (res.status !== 404) {
          response = res;
          break;
        }
      } catch (error) {
        if (url === candidateUrls[candidateUrls.length - 1]) {
          throw error;
        }
      }
    }

    if (!response) {
      throw new Error('Assistant endpoint not found. Start with `npx netlify dev`.');
    }

    const raw = await response.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const fallback = raw ? raw.slice(0, 160) : 'empty response';
      throw new Error(data?.error || `API request failed (${response.status}): ${fallback}`);
    }

    return {
      answer: data?.answer || 'Hello from Khang AI Assistant.',
      targetAnchor: data?.targetAnchor || null,
      targetSection: data?.targetSection || null,
      controls: normalizeControls(data?.controls),
      closing: `${data?.closing || ''}`.trim(),
      action: normalizeAction(data?.action),
      tourStops: Array.isArray(data?.tourStops)
        ? data.tourStops
            .map((stop) => ({
              anchorId: typeof stop?.anchorId === 'string' ? stop.anchorId : null,
              controls: normalizeControls(stop?.controls),
            }))
            .filter((stop) => stop.anchorId)
        : [],
    };
  };

  const executeAssistantAction = (action) => {
    if (!action?.url) {
      return;
    }

    actionFlightRef.current = {
      active: true,
      startedAt: performance.now(),
      hiddenAtCenter: false,
    };
    stopTour();
    clearFocusAnchor();
    extendFreeze(5000);
    roamCooldownUntilRef.current = performance.now() + 5000;

    if (action.type === 'open-link' || action.type === 'open-gmail') {
      window.open(action.url, '_blank', 'noopener,noreferrer');
      return;
    }
  };

  const stopTour = () => {
    tourActiveRef.current = false;
    setIsTourRunning(false);
    if (tourTimerRef.current) {
      window.clearTimeout(tourTimerRef.current);
      tourTimerRef.current = 0;
    }
  };

  const clearFocusAnchor = () => {
    focusAnchorRef.current = null;
    focusAnchorUntilRef.current = 0;
  };

  const setFocusAnchor = (anchorId, durationMs = 12000) => {
    if (!anchorId) {
      clearFocusAnchor();
      return;
    }

    focusAnchorRef.current = anchorId;
    focusAnchorUntilRef.current = Number.isFinite(durationMs) ? performance.now() + durationMs : Number.POSITIVE_INFINITY;
  };

  const getDockTarget = (anchorId) => {
    const el = document.getElementById(anchorId);
    if (!el) {
      return null;
    }

    const rect = el.getBoundingClientRect();
    const bounds = getViewportBounds();
    const bot = botRef.current;
    const size = getAssistantSize();
    const assistantWidth = bot?.offsetWidth || size.width;
    const assistantHeight = bot?.offsetHeight || size.height;

    return {
      x: clamp(rect.left - assistantWidth - 18, bounds.minX, bounds.maxX),
      y: clamp(rect.top + rect.height * 0.5 - assistantHeight * 0.42, bounds.minY, bounds.maxY),
    };
  };

  const runTour = (intro, stops, closing, tourPrompt) => {
    if (!stops.length) {
      setAiReply(intro);
      return;
    }

    tourActiveRef.current = true;
    setIsTourRunning(true);
    proactiveMuteUntilRef.current = Date.now() + 120000;
    setAiReply(intro);
    setRobotCue({
      expression: 'happy',
      followCursor: true,
      stamp: Date.now(),
    });

    const playStep = (index) => {
      if (!tourActiveRef.current) {
        return;
      }

      if (index >= stops.length) {
        setAiReply(closing || 'That is the guided view. Ask me about any part and I can go deeper.');
        setRobotCue({
          expression: 'idle',
          followCursor: true,
          stamp: Date.now(),
        });
        clearFocusAnchor();
        stopTour();
        return;
      }

      const step = stops[index];
      setFocusAnchor(step.anchorId, Number.POSITIVE_INFINITY);
      const target = document.getElementById(step.anchorId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      requestAssistant(
        `Guide the visitor through this stop naturally. Tour request: ${tourPrompt}`,
        sectionFromAnchor(step.anchorId),
        step.anchorId,
        'tour-step',
      )
        .then((result) => {
          if (!tourActiveRef.current) {
            return;
          }

          setAiReply(result.answer);
          setRobotCue({
            ...normalizeControls(result.controls || step.controls),
            stamp: Date.now(),
          });
        })
        .catch(() => {
          if (!tourActiveRef.current) {
            return;
          }

          setRobotCue({
            ...step.controls,
            stamp: Date.now(),
          });
        })
        .finally(() => {
          if (!tourActiveRef.current) {
            return;
          }

          tourTimerRef.current = window.setTimeout(() => {
            playStep(index + 1);
          }, index === 0 ? 5600 : 6200);
        });
    };

    tourTimerRef.current = window.setTimeout(() => {
      playStep(0);
    }, 1800);
  };

  const startGuideTour = async (prompt = 'Guide me through the portfolio in a natural way.') => {
    if (isLoadingRef.current) {
      return;
    }

    stopTour();
    clearFocusAnchor();
    extendFreeze(30000);
    setIsLoading(true);
    isLoadingRef.current = true;
    setAiReply('Planning a short guided tour...');

    try {
      const result = await requestAssistant(prompt, activeSection, activeAnchorRef.current, 'tour-plan', chatHistoryRef.current);
      runTour(result.answer, result.tourStops, result.closing, prompt);
      setQuestion('');
    } catch (error) {
      setAiReply(`AI is temporarily unavailable: ${error.message}`);
      setRobotCue({
        expression: 'sad',
        followCursor: false,
        stamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  const askAI = async (overrideMessage = null) => {
    const content = `${overrideMessage ?? question}`.trim();
    if (!content || isLoadingRef.current) {
      return;
    }

    if (isTourIntent(content)) {
      await startGuideTour(content);
      return;
    }

    stopTour();
    clearFocusAnchor();
    extendFreeze(10000);
    setIsLoading(true);
    isLoadingRef.current = true;

    if (!overrideMessage) {
      setAiReply('Thinking...');
    }

    try {
      const result = await requestAssistant(content, activeSection, activeAnchor, 'chat', chatHistoryRef.current);
      const now = Date.now();
      setAiReply(result.answer);
      setRobotCue({
        ...result.controls,
        stamp: now,
      });
      proactiveMuteUntilRef.current = now + 20000;
      lastProactiveSectionRef.current = result.targetAnchor || result.targetSection || activeAnchor;
      lastProactiveAtRef.current = now;
      chatHistoryRef.current = trimHistory([
        ...chatHistoryRef.current,
        { role: 'user', content },
        { role: 'assistant', content: result.answer },
      ]);

      if (result.targetAnchor) {
        setFocusAnchor(result.targetAnchor, 14000);
        const target = document.getElementById(result.targetAnchor);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else if (result.targetSection) {
        setFocusAnchor(result.targetSection, 12000);
        const target = document.getElementById(result.targetSection);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      if (result.action) {
        window.setTimeout(() => {
          executeAssistantAction(result.action);
        }, 240);
      }

      if (!overrideMessage) {
        setQuestion('');
      }
    } catch (error) {
      setAiReply(`AI is temporarily unavailable: ${error.message}`);
      setRobotCue({
        expression: 'sad',
        followCursor: false,
        stamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
      extendFreeze(20000);
    }
  };

  useEffect(() => {
    const center = getCenterWaypoint();
    const initialX = center.x;
    const initialY = center.y;
    currentRef.current = {
      x: initialX,
      y: initialY,
    };
    targetRef.current = getRandomWaypoint();
    roamCooldownUntilRef.current = performance.now() + 4000;

    const detectSection = () => {
      const anchors = Array.from(document.querySelectorAll('[data-assist-anchor][id]'));
      if (!anchors.length) {
        return;
      }

      const viewportPivot = window.innerHeight * 0.38;
      let closestId = 'home';
      let closestDistance = Number.POSITIVE_INFINITY;

      anchors.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height * 0.25;
        const distance = Math.abs(center - viewportPivot);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestId = el.id;
        }
      });

      const mappedSection = sectionFromAnchor(closestId);
      setActiveAnchor((prev) => (prev === closestId ? prev : closestId));
      setActiveSection((prev) => (prev === mappedSection ? prev : mappedSection));
    };

    const updateByDragPointer = (event) => {
      if (!dragRef.current.active) {
        return;
      }

      const bounds = getViewportBounds();
      const x = clamp(event.clientX - dragRef.current.offsetX, bounds.minX, bounds.maxX);
      const y = clamp(event.clientY - dragRef.current.offsetY, bounds.minY, bounds.maxY);

      currentRef.current.x = x;
      currentRef.current.y = y;
      targetRef.current.x = x;
      targetRef.current.y = y;
      extendFreeze(12000);
    };

    const onPointerMove = (event) => {
      updateByDragPointer(event);
    };

    const onPointerUp = (event) => {
      if (!dragRef.current.active || event.pointerId !== dragRef.current.pointerId) {
        return;
      }

      dragRef.current.active = false;
      dragRef.current.pointerId = null;

      if (shellRef.current && dragRef.current.draggingClassApplied) {
        shellRef.current.classList.remove('dragging');
        dragRef.current.draggingClassApplied = false;
      }
    };

    const onShellPointerDown = (event) => {
      const shell = shellRef.current;
      const bot = botRef.current;
      if (!shell || !bot) {
        return;
      }

      stopTour();
      clearFocusAnchor();
      const rect = bot.getBoundingClientRect();
      dragRef.current.active = true;
      dragRef.current.pointerId = event.pointerId;
      dragRef.current.offsetX = event.clientX - rect.left;
      dragRef.current.offsetY = event.clientY - rect.top;
      targetRef.current = {
        x: currentRef.current.x,
        y: currentRef.current.y,
      };

      shell.classList.add('dragging');
      dragRef.current.draggingClassApplied = true;
      shell.setPointerCapture(event.pointerId);
    };

    const onScroll = () => {
      detectSection();
    };

    const animate = () => {
      const bot = botRef.current;
      if (bot) {
        let renderX = currentRef.current.x;
        let renderY = currentRef.current.y;
        let renderOpacity = 1;

        if (!dragRef.current.active) {
          const now = performance.now();
          const dockAnchor =
            focusAnchorRef.current && (tourActiveRef.current || now < focusAnchorUntilRef.current) ? focusAnchorRef.current : null;
          const dockTarget = dockAnchor ? getDockTarget(dockAnchor) : null;
          const isFrozen = now < freezeUntilRef.current || isLoadingRef.current;

          if (dockTarget) {
            targetRef.current.x = dockTarget.x;
            targetRef.current.y = dockTarget.y;
            currentRef.current.x += (dockTarget.x - currentRef.current.x) * 0.11;
            currentRef.current.y += (dockTarget.y - currentRef.current.y) * 0.11;
          } else {
            if (focusAnchorRef.current && !tourActiveRef.current && now >= focusAnchorUntilRef.current) {
              clearFocusAnchor();
            }

            if (!isFrozen && now >= roamCooldownUntilRef.current) {
              const dx = targetRef.current.x - currentRef.current.x;
              const dy = targetRef.current.y - currentRef.current.y;
              const distance = Math.hypot(dx, dy);

              if (distance < 10) {
                targetRef.current = getRandomWaypoint();
                roamCooldownUntilRef.current = now + 4200 + Math.random() * 3200;
              } else {
                currentRef.current.x += dx * 0.0075;
                currentRef.current.y += dy * 0.009;
              }
            }
          }
        }

        const bounds = getViewportBounds();
        currentRef.current.x = clamp(currentRef.current.x, bounds.minX, bounds.maxX);
        currentRef.current.y = clamp(currentRef.current.y, bounds.minY, bounds.maxY);
        targetRef.current.x = clamp(targetRef.current.x, bounds.minX, bounds.maxX);
        targetRef.current.y = clamp(targetRef.current.y, bounds.minY, bounds.maxY);
        renderX = currentRef.current.x;
        renderY = currentRef.current.y;

        if (actionFlightRef.current.active) {
          const elapsed = performance.now() - actionFlightRef.current.startedAt;

          if (elapsed < 520) {
            const progress = elapsed / 520;
            renderY = currentRef.current.y - 180 * progress;
            renderOpacity = 1 - progress;
          } else if (elapsed < 2520) {
            renderOpacity = 0;
            if (!actionFlightRef.current.hiddenAtCenter) {
              const center = getCenterWaypoint();
              currentRef.current.x = center.x;
              currentRef.current.y = center.y;
              targetRef.current.x = center.x;
              targetRef.current.y = center.y;
              actionFlightRef.current.hiddenAtCenter = true;
            }
            renderX = currentRef.current.x;
            renderY = currentRef.current.y;
          } else if (elapsed < 3040) {
            const progress = (elapsed - 2520) / 520;
            renderX = currentRef.current.x;
            renderY = currentRef.current.y;
            renderOpacity = progress;
          } else {
            actionFlightRef.current.active = false;
            actionFlightRef.current.hiddenAtCenter = false;
            renderX = currentRef.current.x;
            renderY = currentRef.current.y;
            renderOpacity = 1;
          }
        }

        bot.style.transform = `translate3d(${renderX}px, ${renderY}px, 0)`;
        bot.style.opacity = `${renderOpacity}`;
      }

      rafRef.current = window.requestAnimationFrame(animate);
    };

    const onResize = () => {
      const bounds = getViewportBounds();
      currentRef.current.x = clamp(currentRef.current.x, bounds.minX, bounds.maxX);
      currentRef.current.y = clamp(currentRef.current.y, bounds.minY, bounds.maxY);
      targetRef.current.x = clamp(targetRef.current.x, bounds.minX, bounds.maxX);
      targetRef.current.y = clamp(targetRef.current.y, bounds.minY, bounds.maxY);
      detectSection();
    };

    const shell = shellRef.current;
    if (shell) {
      shell.addEventListener('pointerdown', onShellPointerDown);
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    detectSection();
    animate();

    return () => {
      if (shell) {
        shell.removeEventListener('pointerdown', onShellPointerDown);
      }

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);

      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }

      if (tourTimerRef.current) {
        window.clearTimeout(tourTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (tourActiveRef.current) {
      return;
    }

    if (activeAnchor === 'home') {
      return;
    }

    const now = Date.now();
    if (now < proactiveMuteUntilRef.current) {
      return;
    }

    if (lastProactiveSectionRef.current === activeAnchor && now - lastProactiveAtRef.current < 6000) {
      return;
    }

    if (proactiveBusyRef.current) {
      return;
    }

    proactiveBusyRef.current = true;

    requestAssistant(
      `User is now viewing anchor ${activeAnchor} in section ${activeSection}. Give one short proactive line.`,
      activeSection,
      activeAnchor,
      'proactive',
    )
      .then((result) => {
        setAiReply(result.answer);
        setRobotCue({
          ...result.controls,
          stamp: Date.now(),
        });
        lastProactiveSectionRef.current = activeAnchor;
        lastProactiveAtRef.current = Date.now();
      })
      .catch(() => {
      })
      .finally(() => {
        proactiveBusyRef.current = false;
      });
  }, [activeSection, activeAnchor]);

  const onEnterAsk = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      askAI();
    }
  };

  return (
    <div className="assistant-bot" ref={botRef} aria-live="polite" aria-label="Profile assistant robot">
      <div className="assistant-bubble">
        <div className="assistant-ai-panel">
          <p className="assistant-ai-title">Khang AI Assistant</p>
          <p className="assistant-ai-reply">{aiReply}</p>
          <textarea
            className="assistant-ai-input"
            placeholder="Ask about profile, skills, projects..."
            value={question}
            onChange={(event) => {
              stopTour();
              clearFocusAnchor();
              setQuestion(event.target.value);
              extendFreeze(10000);
            }}
            onFocus={() => {
              stopTour();
              clearFocusAnchor();
              extendFreeze(10000);
            }}
            onKeyDown={onEnterAsk}
            rows={2}
          />
          <button type="button" className="assistant-ai-btn" onClick={() => askAI()} disabled={isLoading}>
            {isLoading ? 'Asking...' : 'Ask AI'}
          </button>
          <button
            type="button"
            className="assistant-ai-btn assistant-ai-btn-secondary"
            onClick={() => {
              if (isTourRunning) {
                stopTour();
                clearFocusAnchor();
                return;
              }

              startGuideTour();
            }}
            disabled={isLoading}
          >
            {isTourRunning ? 'Stop Tour' : 'Guide Me'}
          </button>
        </div>
      </div>

      <div className="assistant-robot-shell" ref={shellRef} title="Drag me around">
        <div className="assistant-rive-stage">
          <RiveComponent />
        </div>
      </div>
    </div>
  );
}

export default AssistantRobot;
