from __future__ import annotations

import asyncio
import logging
import random
from typing import Awaitable, Callable, TypeVar


T = TypeVar("T")


async def async_retry(
    operation: Callable[[], Awaitable[T]],
    *,
    retries: int,
    base_delay: float,
    max_delay: float,
    logger: logging.Logger,
    operation_name: str,
    exceptions: tuple[type[BaseException], ...],
) -> T:
    attempt = 0

    while True:
        try:
            return await operation()
        except exceptions as exc:
            attempt += 1
            if attempt > retries:
                logger.error(
                    "Operation %s failed after %s retries: %s",
                    operation_name,
                    retries,
                    exc,
                )
                raise

            delay = min(max_delay, base_delay * (2 ** (attempt - 1)))
            delay += random.uniform(0, min(0.5, base_delay))
            logger.warning(
                "Operation %s failed on attempt %s/%s, retrying in %.2fs: %s",
                operation_name,
                attempt,
                retries,
                delay,
                exc,
            )
            await asyncio.sleep(delay)

