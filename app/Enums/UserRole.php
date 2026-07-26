<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Staff = 'staff';
    case Seller = 'seller';
    case Buyer = 'buyer';
}
