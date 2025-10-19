const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase Storage Service
 * Handles file upload operations and signed URL generation
 */
class SupabaseStorageService {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    // Use service role key for backend operations to bypass RLS
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    this.bucketName = process.env.VERIFICATION_PHOTOS_BUCKET || 'verification-photos';
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('⚠️  Supabase credentials not configured. Storage features will not work.');
      this.supabase = null;
      return;
    }

    this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('✅ Supabase Storage Service initialized');
  }

  /**
   * Generate a signed upload URL for verification photos
   * @param {string} fileName - Name of the file to upload
   * @param {number} expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   * @returns {Object} Object containing the signed URL and file path
   */
  async generateSignedUploadUrl(fileName, expiresIn = 3600) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not initialized. Check your configuration.');
      }

      // Generate unique file path with timestamp
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}-${fileName}`;
      const filePath = `verification-photos/${uniqueFileName}`;

      // Generate signed URL for upload
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUploadUrl(filePath, {
          expiresIn,
          upsert: false // Don't allow overwriting existing files
        });

      if (error) {
        console.error('Supabase signed URL generation error:', error);
        throw new Error(`Failed to generate upload URL: ${error.message}`);
      }

      return {
        signedUrl: data.signedUrl,
        filePath: filePath,
        publicUrl: this.getPublicUrl(filePath),
        expiresAt: new Date(Date.now() + (expiresIn * 1000))
      };
    } catch (error) {
      console.error('Error generating signed upload URL:', error);
      throw error;
    }
  }

  /**
   * Get the public URL for a file
   * @param {string} filePath - Path of the file in storage
   * @returns {string} Public URL of the file
   */
  getPublicUrl(filePath) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized. Check your configuration.');
    }

    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Upload task completion photo directly
   * @param {Object} file - Multer file object
   * @param {string} fileName - Custom filename for the uploaded file
   * @returns {Object} Object containing the public URL and file path
   */
  async uploadTaskPhoto(file, fileName) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not initialized. Check your configuration.');
      }

      if (!file || !file.buffer) {
        throw new Error('Invalid file provided');
      }

      // Generate unique file path
      const timestamp = Date.now();
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const uniqueFileName = `${fileName}.${fileExtension}`;
      const filePath = `task-completions/${uniqueFileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false // Don't overwrite existing files
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      // Get public URL
      const publicUrl = this.getPublicUrl(filePath);

      console.log(`✅ File uploaded successfully: ${filePath}`);
      
      return {
        filePath: data.path,
        publicUrl,
        fileName: uniqueFileName,
        fileSize: file.size,
        mimeType: file.mimetype
      };
    } catch (error) {
      console.error('Upload task photo error:', error);
      throw error;
    }
  }

  /**
   * Delete a file from storage
   * @param {string} filePath - Path of the file to delete
   * @returns {boolean} Success status
   */
  async deleteFile(filePath) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not initialized. Check your configuration.');
      }

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Supabase file deletion error:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * List files in a directory
   * @param {string} path - Directory path to list files from
   * @param {Object} options - Options for listing (limit, offset, etc.)
   * @returns {Array} Array of file objects
   */
  async listFiles(path = '', options = {}) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not initialized. Check your configuration.');
      }

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(path, {
          limit: options.limit || 100,
          offset: options.offset || 0,
          sortBy: options.sortBy || { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Supabase file listing error:', error);
        throw new Error(`Failed to list files: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Check if the service is properly configured
   * @returns {boolean} Configuration status
   */
  isConfigured() {
    return this.supabase !== null;
  }

  /**
   * Get storage info and configuration
   * @returns {Object} Storage service information
   */
  getStorageInfo() {
    return {
      isConfigured: this.isConfigured(),
      bucketName: this.bucketName,
      supabaseUrl: this.supabaseUrl ? '***configured***' : 'not configured'
    };
  }
}

// Create singleton instance
const supabaseStorageService = new SupabaseStorageService();

module.exports = supabaseStorageService;