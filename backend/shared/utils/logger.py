from loguru import logger
import sys

# Configurar logger
logger.remove()
logger.add(
    sys.stdout,
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level="INFO"
)

logger.add(
    "logs/app_{time}.log",
    rotation="500 MB",
    retention="10 days",
    compression="zip",
    level="DEBUG"
)

def get_logger():
    return logger
