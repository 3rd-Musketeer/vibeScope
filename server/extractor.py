# Legacy extractor module - now uses the new extraction pipeline
# This module maintains backward compatibility while using the improved parallel extraction

from extraction_pipeline import extract_note_content, extract_user_profile

# Re-export the functions for backward compatibility
__all__ = ['extract_note_content', 'extract_user_profile']

# The old extract_with_schema function is deprecated in favor of the new pipeline
# All functionality is now handled by extraction_pipeline.py