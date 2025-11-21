import { Contact, IContact } from '../models/Contact';
import mongoose from 'mongoose';

export interface ContactCreateData {
  name: string;
  phone: string;
  email: string;
  message?: string;
}

export class ContactService {
  /**
   * Create a new contact
   */
  static async createContact(contactData: ContactCreateData): Promise<IContact> {
    try {
      const contact = new Contact(contactData);
      return await contact.save();
    } catch (error: any) {
      throw new Error(`Failed to create contact: ${error.message}`);
    }
  }

  /**
   * Get contact by ID
   */
  static async getContactById(id: string): Promise<IContact | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      return await Contact.findById(id);
    } catch (error: any) {
      throw new Error(`Failed to get contact: ${error.message}`);
    }
  }

  /**
   * Get all contacts with pagination and filters
   */
  static async getContacts(options: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    contacts: IContact[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const {
        page = 1,
        pageSize = 10,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      // Build query
      const query: any = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * pageSize;
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query
      const [contacts, totalItems] = await Promise.all([
        Contact.find(query)
          .sort(sort)
          .skip(skip)
          .limit(pageSize),
        Contact.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        contacts,
        totalItems,
        totalPages,
        currentPage: page
      };
    } catch (error: any) {
      throw new Error(`Failed to get contacts: ${error.message}`);
    }
  }

  /**
   * Delete contact
   */
  static async deleteContact(id: string): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return false;
      }

      const result = await Contact.findByIdAndDelete(id);
      return !!result;
    } catch (error: any) {
      throw new Error(`Failed to delete contact: ${error.message}`);
    }
  }

  /**
   * Get contact statistics
   */
  static async getContactStats(): Promise<{
    total: number;
  }> {
    try {
      const total = await Contact.countDocuments({});
      return { total };
    } catch (error: any) {
      throw new Error(`Failed to get contact stats: ${error.message}`);
    }
  }
}
